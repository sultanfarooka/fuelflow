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
/// CQRS Handler: complete password reset via SMS OTP ([M01-F09-R08], [M01-F04-R04]).
/// Verifies the OTP, then uses Identity's reset-token mechanism (generate +
/// immediately consume in one handler) to set the new password.
/// </summary>
public class ResetPasswordWithOtpCommandHandler : IRequestHandler<ResetPasswordWithOtpCommand, Result<VerifyPhoneResponse>>
{
    private const string ExpiredOrExhaustedMessage = "Your recovery code has expired or has been used too many times. Start over from forgot-password.";

    private readonly UserManager<AppUser> _userManager;
    private readonly IPhoneVerificationRepository _phoneVerifications;
    private readonly IOtpHasher _otpHasher;
    private readonly IUnitOfWork _unitOfWork;
    private readonly OtpOptions _otpOptions;
    private readonly ILogger<ResetPasswordWithOtpCommandHandler> _logger;

    public ResetPasswordWithOtpCommandHandler(
        UserManager<AppUser> userManager,
        IPhoneVerificationRepository phoneVerifications,
        IOtpHasher otpHasher,
        IUnitOfWork unitOfWork,
        IOptions<OtpOptions> otpOptions,
        ILogger<ResetPasswordWithOtpCommandHandler> logger)
    {
        _userManager = userManager;
        _phoneVerifications = phoneVerifications;
        _otpHasher = otpHasher;
        _unitOfWork = unitOfWork;
        _otpOptions = otpOptions.Value;
        _logger = logger;
    }

    public async Task<Result<VerifyPhoneResponse>> Handle(ResetPasswordWithOtpCommand request, CancellationToken cancellationToken)
    {
        var req = request.Request;

        var user = await _userManager.Users
            .FirstOrDefaultAsync(u => u.PhoneNumber == req.Phone, cancellationToken);
        if (user is null)
            return Result<VerifyPhoneResponse>.Failure(ExpiredOrExhaustedMessage);

        var verification = await _phoneVerifications.GetActiveForUserAsync(user.Id, OtpPurpose.PasswordRecovery);
        if (verification is null || verification.ExpiresAt <= DateTime.UtcNow)
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

        // Reset the password via Identity's token mechanism (fresh token, used immediately).
        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var resetResult = await _userManager.ResetPasswordAsync(user, token, req.NewPassword);
        if (!resetResult.Succeeded)
        {
            var errors = string.Join(", ", resetResult.Errors.Select(e => e.Description));
            _logger.LogWarning("Password reset failed for user {UserId}: {Errors}", user.Id, errors);
            return Result<VerifyPhoneResponse>.Failure($"Could not set new password: {errors}");
        }

        verification.ConsumedAt = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync();

        // TODO M01-F08 audit: password-reset-via-sms-otp {UserId}.
        _logger.LogInformation("Password reset via SMS OTP: user={UserId}", user.Id);

        return Result<VerifyPhoneResponse>.Success(new VerifyPhoneResponse
        {
            Message = "Your password has been updated. You can sign in now."
        });
    }
}
