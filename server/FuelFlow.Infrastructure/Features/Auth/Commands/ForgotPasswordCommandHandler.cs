using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.Auth;
using FuelFlow.Application.Features.Auth.Commands;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Application.Interfaces.Services;
using FuelFlow.Domain.Entities;
using FuelFlow.Domain.Enums;
using FuelFlow.Infrastructure.Identity;
using FuelFlow.Infrastructure.Services.Options;

namespace FuelFlow.Infrastructure.Features.Auth.Commands;

/// <summary>
/// CQRS Handler: password recovery entry point ([M01-F09-R08], [M01-F04-R04]).
/// Resolves the user by phone or verified email; reports eligible channels.
/// If exactly one channel is eligible, auto-dispatches via it; if the caller
/// chose an eligible channel, dispatches via that. Never leaks account
/// existence — unknown identifiers get the same generic success shape.
/// </summary>
public class ForgotPasswordCommandHandler : IRequestHandler<ForgotPasswordCommand, Result<ForgotPasswordResponse>>
{
    private readonly UserManager<AppUser> _userManager;
    private readonly IAuthService _authService;
    private readonly IPhoneVerificationRepository _phoneVerifications;
    private readonly IOtpHasher _otpHasher;
    private readonly ISmsSender _smsSender;
    private readonly IUnitOfWork _unitOfWork;
    private readonly OtpOptions _otpOptions;
    private readonly ILogger<ForgotPasswordCommandHandler> _logger;

    public ForgotPasswordCommandHandler(
        UserManager<AppUser> userManager,
        IAuthService authService,
        IPhoneVerificationRepository phoneVerifications,
        IOtpHasher otpHasher,
        ISmsSender smsSender,
        IUnitOfWork unitOfWork,
        IOptions<OtpOptions> otpOptions,
        ILogger<ForgotPasswordCommandHandler> logger)
    {
        _userManager = userManager;
        _authService = authService;
        _phoneVerifications = phoneVerifications;
        _otpHasher = otpHasher;
        _smsSender = smsSender;
        _unitOfWork = unitOfWork;
        _otpOptions = otpOptions.Value;
        _logger = logger;
    }

    public async Task<Result<ForgotPasswordResponse>> Handle(
        ForgotPasswordCommand request,
        CancellationToken cancellationToken)
    {
        var req = request.Request;
        var identifier = req.Identifier?.Trim() ?? string.Empty;
        var isEmailIdentifier = identifier.Contains('@');

        AppUser? user;
        if (isEmailIdentifier)
        {
            var byEmail = await _userManager.FindByEmailAsync(identifier);
            user = (byEmail != null && byEmail.EmailConfirmed) ? byEmail : null;
        }
        else
        {
            user = await _userManager.Users
                .FirstOrDefaultAsync(u => u.PhoneNumber == identifier, cancellationToken);
        }

        // Anti-enumeration: unknown / unverified identifier -> generic success, no channels.
        if (user is null || !user.IsActive)
            return Result<ForgotPasswordResponse>.Success(new ForgotPasswordResponse());

        // Build eligible channels list from the user's verified channels.
        var eligible = new List<string>();
        if (!string.IsNullOrEmpty(user.PhoneNumber) && user.PhoneNumberConfirmed) eligible.Add("sms");
        if (!string.IsNullOrEmpty(user.Email) && user.EmailConfirmed) eligible.Add("email");

        var response = new ForgotPasswordResponse
        {
            EligibleChannels = eligible,
            MaskedPhone = eligible.Contains("sms") ? MaskPhone(user.PhoneNumber!) : null,
            MaskedEmail = eligible.Contains("email") ? MaskEmail(user.Email!) : null,
        };

        if (eligible.Count == 0)
            return Result<ForgotPasswordResponse>.Success(response);

        // Decide which channel to dispatch on (if any) for this submission.
        string? channelToUse = null;
        if (!string.IsNullOrWhiteSpace(req.Channel) && eligible.Contains(req.Channel))
            channelToUse = req.Channel;
        else if (string.IsNullOrWhiteSpace(req.Channel) && eligible.Count == 1)
            channelToUse = eligible[0];

        if (channelToUse is null)
            // Multiple eligible channels and no choice yet — surface the chooser.
            return Result<ForgotPasswordResponse>.Success(response);

        if (channelToUse == "sms")
        {
            // Daily cap ([M01-F09-R12]).
            var since = DateTime.UtcNow.AddDays(-1);
            var issuedToday = await _phoneVerifications.CountIssuedSinceAsync(user.Id, since);
            if (issuedToday >= _otpOptions.DailyCapPerPhone)
                return Result<ForgotPasswordResponse>.Failure("Daily verification code limit reached. Try again tomorrow.");

            var now = DateTime.UtcNow;
            await _phoneVerifications.ConsumeActiveAsync(user.Id, OtpPurpose.PasswordRecovery, now);

            var code = _otpHasher.GenerateCode();
            var fresh = new PhoneVerification
            {
                UserId = user.Id,
                CodeHash = _otpHasher.Hash(code),
                ExpiresAt = now.AddMinutes(_otpOptions.TtlMinutes),
                Purpose = OtpPurpose.PasswordRecovery,
                CreatedAt = now,
                UpdatedAt = now
            };
            await _phoneVerifications.AddAsync(fresh);
            await _unitOfWork.SaveChangesAsync();

            // TODO M01-F08 audit: recovery-channel-used {UserId, Channel=sms}.
            _logger.LogInformation("Password-recovery OTP issued: user={UserId}", user.Id);

            try
            {
                await _smsSender.SendSmsAsync(
                    user.PhoneNumber!,
                    $"Your Fuel Flow password reset code is {code}. It expires in {_otpOptions.TtlMinutes} minutes.",
                    cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "SMS dispatch failed for password recovery user={UserId}", user.Id);
            }
        }
        else // "email"
        {
            // TODO M01-F08 audit: recovery-channel-used {UserId, Channel=email}.
            _ = await _authService.SendPasswordResetEmailAsync(user.Email!, cancellationToken);
        }

        response.Dispatched = true;
        response.ChannelUsed = channelToUse;
        response.Message = channelToUse == "sms"
            ? "We've sent a recovery code to your phone."
            : "We've sent a recovery link to your email.";

        return Result<ForgotPasswordResponse>.Success(response);
    }

    private static string MaskPhone(string phone)
    {
        if (string.IsNullOrEmpty(phone) || phone.Length <= 7) return "***";
        return string.Concat(phone.AsSpan(0, 3), new string('*', phone.Length - 7), phone.AsSpan(phone.Length - 4));
    }

    private static string MaskEmail(string email)
    {
        var at = email.IndexOf('@');
        if (at <= 0) return "***";
        var local = email[..at];
        var domain = email[at..];
        if (local.Length <= 1) return $"*{domain}";
        return $"{local[0]}{new string('*', Math.Max(1, local.Length - 1))}{domain}";
    }
}
