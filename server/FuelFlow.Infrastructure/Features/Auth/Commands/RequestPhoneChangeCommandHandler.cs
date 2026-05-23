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
/// CQRS Handler: request a phone-number change ([M01-F09-R11]).
/// Issues an OTP to the NEW number — the swap on <see cref="AppUser.PhoneNumber"/>
/// happens in <see cref="ConfirmPhoneChangeCommandHandler"/> after the user
/// proves ownership.
/// </summary>
public class RequestPhoneChangeCommandHandler : IRequestHandler<RequestPhoneChangeCommand, Result<VerifyPhoneResponse>>
{
    private readonly UserManager<AppUser> _userManager;
    private readonly ICurrentUserService _currentUser;
    private readonly IPhoneVerificationRepository _phoneVerifications;
    private readonly IOtpHasher _otpHasher;
    private readonly ISmsSender _smsSender;
    private readonly IUnitOfWork _unitOfWork;
    private readonly OtpOptions _otpOptions;
    private readonly ILogger<RequestPhoneChangeCommandHandler> _logger;

    public RequestPhoneChangeCommandHandler(
        UserManager<AppUser> userManager,
        ICurrentUserService currentUser,
        IPhoneVerificationRepository phoneVerifications,
        IOtpHasher otpHasher,
        ISmsSender smsSender,
        IUnitOfWork unitOfWork,
        IOptions<OtpOptions> otpOptions,
        ILogger<RequestPhoneChangeCommandHandler> logger)
    {
        _userManager = userManager;
        _currentUser = currentUser;
        _phoneVerifications = phoneVerifications;
        _otpHasher = otpHasher;
        _smsSender = smsSender;
        _unitOfWork = unitOfWork;
        _otpOptions = otpOptions.Value;
        _logger = logger;
    }

    public async Task<Result<VerifyPhoneResponse>> Handle(RequestPhoneChangeCommand request, CancellationToken cancellationToken)
    {
        var newPhone = request.Request.NewPhone?.Trim() ?? string.Empty;

        if (_currentUser.UserId is not Guid userId)
            return Result<VerifyPhoneResponse>.Failure("Authentication required.");

        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user is null)
            return Result<VerifyPhoneResponse>.Failure("Authentication required.");

        if (string.Equals(user.PhoneNumber, newPhone, StringComparison.Ordinal))
            return Result<VerifyPhoneResponse>.Failure("That is already your current phone number.");

        // Uniqueness — block if any *other* user already owns this phone.
        var taken = await _userManager.Users
            .AsNoTracking()
            .AnyAsync(u => u.PhoneNumber == newPhone && u.Id != userId, cancellationToken);
        if (taken)
            return Result<VerifyPhoneResponse>.Failure("That phone number is already in use.");

        // Daily cap ([M01-F09-R12]) across all OTP purposes for this user.
        var since = DateTime.UtcNow.AddDays(-1);
        var issuedToday = await _phoneVerifications.CountIssuedSinceAsync(userId, since);
        if (issuedToday >= _otpOptions.DailyCapPerPhone)
            return Result<VerifyPhoneResponse>.Failure("Daily verification code limit reached. Try again tomorrow.");

        // Consume any prior PhoneChange OTPs so "active" stays singular.
        var now = DateTime.UtcNow;
        await _phoneVerifications.ConsumeActiveAsync(userId, OtpPurpose.PhoneChange, now);

        var code = _otpHasher.GenerateCode();
        var fresh = new PhoneVerification
        {
            UserId = userId,
            CodeHash = _otpHasher.Hash(code),
            ExpiresAt = now.AddMinutes(_otpOptions.TtlMinutes),
            Purpose = OtpPurpose.PhoneChange,
            TargetPhone = newPhone,
            CreatedAt = now,
            UpdatedAt = now
        };
        await _phoneVerifications.AddAsync(fresh);
        await _unitOfWork.SaveChangesAsync();

        // TODO M01-F08 audit: phone-change-requested {UserId, FromPhone, ToPhone}.
        _logger.LogInformation("Phone-change requested: user={UserId}", userId);

        try
        {
            await _smsSender.SendSmsAsync(
                newPhone,
                $"Your Fuel Flow verification code is {code}. It expires in {_otpOptions.TtlMinutes} minutes.",
                cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "SMS dispatch failed for phone-change request user={UserId}", userId);
        }

        return Result<VerifyPhoneResponse>.Success(new VerifyPhoneResponse
        {
            Message = "A verification code has been sent to the new phone number."
        });
    }
}
