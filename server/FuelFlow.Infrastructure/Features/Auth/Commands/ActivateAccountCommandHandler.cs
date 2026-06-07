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
/// CQRS Handler: activate an invited sub-user in one step ([M01-F05-R02], [M01-F09-R07]) —
/// verify the signup-purpose OTP and set the first password together. Mirrors
/// <see cref="VerifyPhoneCommandHandler"/> + <see cref="ResetPasswordWithOtpCommandHandler"/>;
/// uses a generic "expired or exhausted" message to avoid phone enumeration.
/// </summary>
public class ActivateAccountCommandHandler : IRequestHandler<ActivateAccountCommand, Result<VerifyPhoneResponse>>
{
    private const string ExpiredOrExhaustedMessage = "Your verification code has expired or has been used too many times. Tap resend to get a new one.";

    private readonly UserManager<AppUser> _userManager;
    private readonly IPhoneVerificationRepository _phoneVerifications;
    private readonly IOtpHasher _otpHasher;
    private readonly IUnitOfWork _unitOfWork;
    private readonly OtpOptions _otpOptions;
    private readonly ILogger<ActivateAccountCommandHandler> _logger;

    public ActivateAccountCommandHandler(
        UserManager<AppUser> userManager,
        IPhoneVerificationRepository phoneVerifications,
        IOtpHasher otpHasher,
        IUnitOfWork unitOfWork,
        IOptions<OtpOptions> otpOptions,
        ILogger<ActivateAccountCommandHandler> logger)
    {
        _userManager = userManager;
        _phoneVerifications = phoneVerifications;
        _otpHasher = otpHasher;
        _unitOfWork = unitOfWork;
        _otpOptions = otpOptions.Value;
        _logger = logger;
    }

    public async Task<Result<VerifyPhoneResponse>> Handle(ActivateAccountCommand request, CancellationToken cancellationToken)
    {
        var req = request.Request;

        var user = await _userManager.Users
            .FirstOrDefaultAsync(u => u.PhoneNumber == req.Phone, cancellationToken);
        if (user is null || !user.IsActive)
            return Result<VerifyPhoneResponse>.Failure(ExpiredOrExhaustedMessage);

        var verification = await _phoneVerifications.GetActiveForUserAsync(user.Id, OtpPurpose.Signup);
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

        // Set the first password via Identity's reset-token mechanism (works whether or not a
        // password already exists — the OTP-required invite path creates the user with none).
        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var resetResult = await _userManager.ResetPasswordAsync(user, token, req.NewPassword);
        if (!resetResult.Succeeded)
        {
            var errors = string.Join(", ", resetResult.Errors.Select(e => e.Description));
            _logger.LogWarning("Account activation password-set failed for user {UserId}: {Errors}", user.Id, errors);
            return Result<VerifyPhoneResponse>.Failure($"Could not set your password: {errors}");
        }

        verification.ConsumedAt = DateTime.UtcNow;
        user.PhoneNumberConfirmed = true;
        user.UpdatedAt = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("Account activated via OTP: user={UserId}", user.Id);

        return Result<VerifyPhoneResponse>.Success(new VerifyPhoneResponse
        {
            Message = "Your account is active. You can sign in now."
        });
    }
}
