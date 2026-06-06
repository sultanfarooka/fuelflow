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
/// CQRS Handler: register a new Owner — phone-first per [M01-F09].
/// Phone is required and unique; email is optional and (when present) must also
/// be unique. SMS OTP is dispatched immediately so the user can verify the phone
/// and unblock login ([M01-F09-R03]). When email is supplied, the existing email
/// verification email is also sent.
/// M14 contract: ControlPlane only — no TenantDbContextAccessor used [M14-F05-R02].
/// </summary>
public class RegisterCommandHandler : IRequestHandler<RegisterCommand, Result<RegisterResponse>>
{
    private readonly UserManager<AppUser> _userManager;
    private readonly IAuthService _authService;
    private readonly IPhoneVerificationRepository _phoneVerifications;
    private readonly IOtpHasher _otpHasher;
    private readonly ISmsSender _smsSender;
    private readonly IUnitOfWork _unitOfWork;
    private readonly OtpOptions _otpOptions;
    private readonly ILogger<RegisterCommandHandler> _logger;

    public RegisterCommandHandler(
        UserManager<AppUser> userManager,
        IAuthService authService,
        IPhoneVerificationRepository phoneVerifications,
        IOtpHasher otpHasher,
        ISmsSender smsSender,
        IUnitOfWork unitOfWork,
        IOptions<OtpOptions> otpOptions,
        ILogger<RegisterCommandHandler> logger)
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

    public async Task<Result<RegisterResponse>> Handle(
        RegisterCommand request,
        CancellationToken cancellationToken)
    {
        var req = request.Request;
        var hasEmail = !string.IsNullOrWhiteSpace(req.Email);

        // --- Step 1: Phone uniqueness ([M01-F09-R02]) ---
        var phoneTaken = await _userManager.Users
            .AsNoTracking()
            .AnyAsync(u => u.PhoneNumber == req.Phone, cancellationToken);
        if (phoneTaken)
            return Result<RegisterResponse>.Failure("An account with this phone number already exists.");

        // --- Step 2: Email uniqueness when provided ([M01-F01-R01]) ---
        if (hasEmail)
        {
            var existingEmail = await _userManager.FindByEmailAsync(req.Email!);
            if (existingEmail != null)
                return Result<RegisterResponse>.Failure("An account with this email already exists.");
        }

        try
        {
            // --- Step 3: Create AppUser. UserName = phone (always present); email optional ---
            var user = new AppUser
            {
                UserName = req.Phone,
                Email = hasEmail ? req.Email : null,
                PhoneNumber = req.Phone,
                PhoneNumberConfirmed = false,
                FullName = req.FullName,
                OrganizationId = null,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            var createUserResult = await _userManager.CreateAsync(user, req.Password);
            if (!createUserResult.Succeeded)
            {
                var errors = string.Join(", ", createUserResult.Errors.Select(e => e.Description));
                return Result<RegisterResponse>.Failure($"Failed to create user: {errors}");
            }

            // --- Step 4: Assign Owner role ---
            var addRoleResult = await _userManager.AddToRoleAsync(user, UserRole.Owner.ToString());
            if (!addRoleResult.Succeeded)
            {
                var errors = string.Join(", ", addRoleResult.Errors.Select(e => e.Description));
                _logger.LogWarning("Failed to assign Owner role to user {UserId}: {Errors}", user.Id, errors);
            }

            // --- Step 5: Issue signup OTP and send via SMS ([M01-F09-R03], [R04]) ---
            var code = _otpHasher.GenerateCode();
            var now = DateTime.UtcNow;
            var verification = new PhoneVerification
            {
                UserId = user.Id,
                CodeHash = _otpHasher.Hash(code),
                ExpiresAt = now.AddMinutes(_otpOptions.TtlMinutes),
                Purpose = OtpPurpose.Signup,
                CreatedAt = now,
                UpdatedAt = now
            };
            await _phoneVerifications.AddAsync(verification);
            await _unitOfWork.SaveChangesAsync();

            // Audit primer for [M01-F09-R09] (deferred to M01-F08 PR).
            _logger.LogInformation("OTP issued: user={UserId} purpose={Purpose}", user.Id, OtpPurpose.Signup);

            try
            {
                await _smsSender.SendSmsAsync(
                    req.Phone,
                    $"Your Fuel Flow verification code is {code}. It expires in {_otpOptions.TtlMinutes} minutes.",
                    cancellationToken);
            }
            catch (Exception smsEx)
            {
                // Don't fail registration if SMS dispatch hiccups — user can hit resend.
                _logger.LogError(smsEx, "SMS dispatch failed for new user {UserId}; user can resend OTP", user.Id);
            }

            // --- Step 6: Email verification email if email was provided ---
            if (hasEmail)
            {
                _ = await _authService.SendVerificationEmailAsync(user.Id, cancellationToken);
            }

            var msg = hasEmail
                ? "We've sent a verification code to your phone and a verification link to your email."
                : "We've sent a verification code to your phone.";

            return Result<RegisterResponse>.Success(new RegisterResponse { Message = msg });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Registration failed for phone {Phone}", req.Phone);
            return Result<RegisterResponse>.Failure("An error occurred while creating your account. Please try again later.");
        }
    }
}
