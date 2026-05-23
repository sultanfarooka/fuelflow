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
using FuelFlow.Domain.Enums;
using FuelFlow.Infrastructure.Identity;
using FuelFlow.Infrastructure.Services.Options;

namespace FuelFlow.Infrastructure.Features.Auth.Commands;

/// <summary>
/// CQRS Handler: confirm a phone-number change ([M01-F09-R11]).
/// Requires the user-submitted <c>NewPhone</c> to match the stored
/// <see cref="Domain.Entities.PhoneVerification.TargetPhone"/> — otherwise an
/// attacker with a valid OTP could swap to a different number than they
/// requested. Re-validates uniqueness at confirm time in case another user
/// claimed the number in the meantime.
/// </summary>
public class ConfirmPhoneChangeCommandHandler : IRequestHandler<ConfirmPhoneChangeCommand, Result<VerifyPhoneResponse>>
{
    private const string ExpiredOrExhaustedMessage = "Your verification code has expired or has been used too many times. Request a new one.";

    private readonly UserManager<AppUser> _userManager;
    private readonly ICurrentUserService _currentUser;
    private readonly IPhoneVerificationRepository _phoneVerifications;
    private readonly IOtpHasher _otpHasher;
    private readonly IUnitOfWork _unitOfWork;
    private readonly OtpOptions _otpOptions;
    private readonly ILogger<ConfirmPhoneChangeCommandHandler> _logger;

    public ConfirmPhoneChangeCommandHandler(
        UserManager<AppUser> userManager,
        ICurrentUserService currentUser,
        IPhoneVerificationRepository phoneVerifications,
        IOtpHasher otpHasher,
        IUnitOfWork unitOfWork,
        IOptions<OtpOptions> otpOptions,
        ILogger<ConfirmPhoneChangeCommandHandler> logger)
    {
        _userManager = userManager;
        _currentUser = currentUser;
        _phoneVerifications = phoneVerifications;
        _otpHasher = otpHasher;
        _unitOfWork = unitOfWork;
        _otpOptions = otpOptions.Value;
        _logger = logger;
    }

    public async Task<Result<VerifyPhoneResponse>> Handle(ConfirmPhoneChangeCommand request, CancellationToken cancellationToken)
    {
        var req = request.Request;
        var newPhone = req.NewPhone?.Trim() ?? string.Empty;

        if (_currentUser.UserId is not Guid userId)
            return Result<VerifyPhoneResponse>.Failure("Authentication required.");

        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user is null)
            return Result<VerifyPhoneResponse>.Failure("Authentication required.");

        var verification = await _phoneVerifications.GetActiveForUserAsync(userId, OtpPurpose.PhoneChange);
        if (verification is null || verification.ExpiresAt <= DateTime.UtcNow)
            return Result<VerifyPhoneResponse>.Failure(ExpiredOrExhaustedMessage);

        // Submitted phone must match what was requested.
        if (!string.Equals(verification.TargetPhone, newPhone, StringComparison.Ordinal))
            return Result<VerifyPhoneResponse>.Failure(ExpiredOrExhaustedMessage);

        verification.AttemptCount += 1;
        verification.UpdatedAt = DateTime.UtcNow;

        if (verification.AttemptCount > _otpOptions.MaxAttempts)
        {
            verification.ConsumedAt = DateTime.UtcNow;
            await _unitOfWork.SaveChangesAsync();
            return Result<VerifyPhoneResponse>.Failure(ExpiredOrExhaustedMessage);
        }

        if (!_otpHasher.Verify(req.Code, verification.CodeHash))
        {
            await _unitOfWork.SaveChangesAsync();
            var remaining = Math.Max(0, _otpOptions.MaxAttempts - verification.AttemptCount);
            return Result<VerifyPhoneResponse>.Failure(
                remaining > 0
                    ? $"That code is incorrect. {remaining} attempt(s) remaining."
                    : ExpiredOrExhaustedMessage);
        }

        // Re-validate uniqueness — someone else could have claimed the phone since the OTP was issued.
        var taken = await _userManager.Users
            .AsNoTracking()
            .AnyAsync(u => u.PhoneNumber == newPhone && u.Id != userId, cancellationToken);
        if (taken)
        {
            verification.ConsumedAt = DateTime.UtcNow;
            await _unitOfWork.SaveChangesAsync();
            return Result<VerifyPhoneResponse>.Failure("That phone number is already in use.");
        }

        verification.ConsumedAt = DateTime.UtcNow;
        user.PhoneNumber = newPhone;
        user.PhoneNumberConfirmed = true;
        user.UpdatedAt = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync();

        // TODO M01-F08 audit: phone-change-confirmed {UserId, NewPhone}.
        _logger.LogInformation("Phone-change confirmed: user={UserId}", userId);

        return Result<VerifyPhoneResponse>.Success(new VerifyPhoneResponse
        {
            Message = "Your phone number has been updated."
        });
    }
}
