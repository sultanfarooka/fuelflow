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
/// CQRS Handler: verify a phone OTP issued during signup ([M01-F09-R03], [R04]).
/// Returns a generic "expired or exhausted" message for missing user / no active OTP
/// / expired / too-many-attempts so unsuccessful probing can't enumerate phone numbers.
/// M14 contract: ControlPlane only — no TenantDbContextAccessor used [M14-F05-R02].
/// </summary>
public class VerifyPhoneCommandHandler : IRequestHandler<VerifyPhoneCommand, Result<VerifyPhoneResponse>>
{
    private const string ExpiredOrExhaustedMessage = "Your verification code has expired or has been used too many times. Tap resend to get a new one.";

    private readonly UserManager<AppUser> _userManager;
    private readonly IPhoneVerificationRepository _phoneVerifications;
    private readonly IOtpHasher _otpHasher;
    private readonly IUnitOfWork _unitOfWork;
    private readonly OtpOptions _otpOptions;
    private readonly ILogger<VerifyPhoneCommandHandler> _logger;

    public VerifyPhoneCommandHandler(
        UserManager<AppUser> userManager,
        IPhoneVerificationRepository phoneVerifications,
        IOtpHasher otpHasher,
        IUnitOfWork unitOfWork,
        IOptions<OtpOptions> otpOptions,
        ILogger<VerifyPhoneCommandHandler> logger)
    {
        _userManager = userManager;
        _phoneVerifications = phoneVerifications;
        _otpHasher = otpHasher;
        _unitOfWork = unitOfWork;
        _otpOptions = otpOptions.Value;
        _logger = logger;
    }

    public async Task<Result<VerifyPhoneResponse>> Handle(VerifyPhoneCommand request, CancellationToken cancellationToken)
    {
        var req = request.Request;

        var user = await _userManager.Users
            .FirstOrDefaultAsync(u => u.PhoneNumber == req.Phone, cancellationToken);
        if (user is null)
            return Result<VerifyPhoneResponse>.Failure(ExpiredOrExhaustedMessage);

        var verification = await _phoneVerifications.GetActiveForUserAsync(user.Id, OtpPurpose.Signup);
        if (verification is null || verification.ExpiresAt <= DateTime.UtcNow)
        {
            _logger.LogInformation("OTP verify failed (no active or expired): user={UserId}", user.Id);
            return Result<VerifyPhoneResponse>.Failure(ExpiredOrExhaustedMessage);
        }

        // Increment attempt count first so an over-cap attempt counts as one final attempt.
        verification.AttemptCount += 1;
        verification.UpdatedAt = DateTime.UtcNow;

        if (verification.AttemptCount > _otpOptions.MaxAttempts)
        {
            verification.ConsumedAt = DateTime.UtcNow;
            await _unitOfWork.SaveChangesAsync();
            _logger.LogInformation("OTP verify failed (exhausted): user={UserId} attempts={Attempts}", user.Id, verification.AttemptCount);
            return Result<VerifyPhoneResponse>.Failure(ExpiredOrExhaustedMessage);
        }

        if (!_otpHasher.Verify(req.Code, verification.CodeHash))
        {
            await _unitOfWork.SaveChangesAsync();
            var remaining = Math.Max(0, _otpOptions.MaxAttempts - verification.AttemptCount);
            _logger.LogInformation("OTP verify failed (wrong code): user={UserId} attempts={Attempts}", user.Id, verification.AttemptCount);
            return Result<VerifyPhoneResponse>.Failure(
                remaining > 0
                    ? $"That code is incorrect. {remaining} attempt(s) remaining."
                    : ExpiredOrExhaustedMessage);
        }

        // Success.
        verification.ConsumedAt = DateTime.UtcNow;
        user.PhoneNumberConfirmed = true;
        user.UpdatedAt = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync();
        _logger.LogInformation("OTP verified: user={UserId} purpose={Purpose}", user.Id, OtpPurpose.Signup);

        return Result<VerifyPhoneResponse>.Success(new VerifyPhoneResponse());
    }
}
