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
/// CQRS Handler: re-issue the signup phone OTP ([M01-F09-R04], [R10], [R12]).
///
/// Returns a generic success response for missing user / no pending verification
/// so this endpoint cannot be used to enumerate phone numbers. Errors are only
/// returned for genuine rate-limit / cap violations (in those cases the caller
/// IS the user — the response is informative, not an enumeration leak).
/// </summary>
public class ResendOtpCommandHandler : IRequestHandler<ResendOtpCommand, Result<VerifyPhoneResponse>>
{
    private static readonly VerifyPhoneResponse GenericResponse = new()
    {
        Message = "If this phone has a pending verification, a new code has been sent."
    };

    private readonly UserManager<AppUser> _userManager;
    private readonly IPhoneVerificationRepository _phoneVerifications;
    private readonly IOtpHasher _otpHasher;
    private readonly ISmsSender _smsSender;
    private readonly IUnitOfWork _unitOfWork;
    private readonly OtpOptions _otpOptions;
    private readonly ILogger<ResendOtpCommandHandler> _logger;

    public ResendOtpCommandHandler(
        UserManager<AppUser> userManager,
        IPhoneVerificationRepository phoneVerifications,
        IOtpHasher otpHasher,
        ISmsSender smsSender,
        IUnitOfWork unitOfWork,
        IOptions<OtpOptions> otpOptions,
        ILogger<ResendOtpCommandHandler> logger)
    {
        _userManager = userManager;
        _phoneVerifications = phoneVerifications;
        _otpHasher = otpHasher;
        _smsSender = smsSender;
        _unitOfWork = unitOfWork;
        _otpOptions = otpOptions.Value;
        _logger = logger;
    }

    public async Task<Result<VerifyPhoneResponse>> Handle(ResendOtpCommand request, CancellationToken cancellationToken)
    {
        var req = request.Request;

        var user = await _userManager.Users
            .FirstOrDefaultAsync(u => u.PhoneNumber == req.Phone, cancellationToken);
        if (user is null)
            return Result<VerifyPhoneResponse>.Success(GenericResponse);

        // Daily cap ([M01-F09-R12]). Counts across all purposes for a single user.
        var since = DateTime.UtcNow.AddDays(-1);
        var issuedToday = await _phoneVerifications.CountIssuedSinceAsync(user.Id, since);
        if (issuedToday >= _otpOptions.DailyCapPerPhone)
            return Result<VerifyPhoneResponse>.Failure("Daily verification code limit reached. Try again tomorrow.");

        var existing = await _phoneVerifications.GetActiveForUserAsync(user.Id, OtpPurpose.Signup);
        if (existing is null)
            return Result<VerifyPhoneResponse>.Success(GenericResponse);

        // 60s cooldown vs. last issuance ([M01-F09-R04]).
        var secondsSinceLast = (DateTime.UtcNow - existing.CreatedAt).TotalSeconds;
        if (secondsSinceLast < _otpOptions.ResendCooldownSeconds)
        {
            var retry = (int)Math.Ceiling(_otpOptions.ResendCooldownSeconds - secondsSinceLast);
            return Result<VerifyPhoneResponse>.Failure($"Please wait {retry}s before requesting another code.");
        }

        // Consume the previous active row(s) so "active" stays singular per purpose.
        var now = DateTime.UtcNow;
        await _phoneVerifications.ConsumeActiveAsync(user.Id, OtpPurpose.Signup, now);

        var code = _otpHasher.GenerateCode();
        var fresh = new PhoneVerification
        {
            UserId = user.Id,
            CodeHash = _otpHasher.Hash(code),
            ExpiresAt = now.AddMinutes(_otpOptions.TtlMinutes),
            ResendCount = existing.ResendCount + 1,
            Purpose = OtpPurpose.Signup,
            CreatedAt = now,
            UpdatedAt = now
        };
        await _phoneVerifications.AddAsync(fresh);
        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("OTP re-issued: user={UserId} purpose={Purpose}", user.Id, OtpPurpose.Signup);

        try
        {
            await _smsSender.SendSmsAsync(
                req.Phone,
                $"Your Fuel Flow verification code is {code}. It expires in {_otpOptions.TtlMinutes} minutes.",
                cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "SMS resend failed for user {UserId}", user.Id);
        }

        return Result<VerifyPhoneResponse>.Success(new VerifyPhoneResponse { Message = "A new verification code has been sent." });
    }
}
