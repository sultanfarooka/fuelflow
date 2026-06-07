using System.Security.Cryptography;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.Users;
using FuelFlow.Application.Features.Users.Commands;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Application.Interfaces.Services;
using FuelFlow.Domain.Entities;
using FuelFlow.Domain.Enums;
using FuelFlow.Infrastructure.Identity;
using FuelFlow.Infrastructure.Services.Options;

namespace FuelFlow.Infrastructure.Features.Users.Commands;

/// <summary>
/// CQRS Handler: an Owner creates a Manager user for their organization ([M01-F05-R02]).
///
/// Cross-context write (no distributed transaction): the AppUser + Manager role live in
/// the control plane (Identity), while the UserStation assignment rows live in the tenant
/// DB. All validation runs before any write; the only multi-write failure window
/// (<see cref="IUnitOfWork.SaveChangesAsync"/>) compensates by deleting the just-created
/// AppUser, which is useless to login until OTP + stations exist.
///
/// Onboarding ([M01-F09-R07]): when RequireOtp is true (default) the account is created
/// pending (no password, PhoneNumberConfirmed=false) and a signup OTP is sent so the
/// Manager self-activates (see ActivateAccountCommandHandler). When false, the account is
/// created phone-confirmed with a one-time temporary password returned to the Owner.
/// </summary>
public class CreateManagerCommandHandler : IRequestHandler<CreateManagerCommand, Result<CreateManagerResponse>>
{
    private readonly UserManager<AppUser> _userManager;
    private readonly ICurrentUserService _currentUser;
    private readonly IStationRepository _stationRepo;
    private readonly IUserStationRepository _userStationRepo;
    private readonly IPhoneVerificationRepository _phoneVerifications;
    private readonly IOtpHasher _otpHasher;
    private readonly ISmsSender _smsSender;
    private readonly ISubscriptionRepository _subscriptionRepo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly OtpOptions _otpOptions;
    private readonly ILogger<CreateManagerCommandHandler> _logger;

    public CreateManagerCommandHandler(
        UserManager<AppUser> userManager,
        ICurrentUserService currentUser,
        IStationRepository stationRepo,
        IUserStationRepository userStationRepo,
        IPhoneVerificationRepository phoneVerifications,
        IOtpHasher otpHasher,
        ISmsSender smsSender,
        ISubscriptionRepository subscriptionRepo,
        IUnitOfWork unitOfWork,
        IOptions<OtpOptions> otpOptions,
        ILogger<CreateManagerCommandHandler> logger)
    {
        _userManager = userManager;
        _currentUser = currentUser;
        _stationRepo = stationRepo;
        _userStationRepo = userStationRepo;
        _phoneVerifications = phoneVerifications;
        _otpHasher = otpHasher;
        _smsSender = smsSender;
        _subscriptionRepo = subscriptionRepo;
        _unitOfWork = unitOfWork;
        _otpOptions = otpOptions.Value;
        _logger = logger;
    }

    public async Task<Result<CreateManagerResponse>> Handle(CreateManagerCommand request, CancellationToken cancellationToken)
    {
        var req = request.Request;

        // --- Step 1: Authenticated Owner with an organization (defense-in-depth behind [Authorize(Roles="Owner")]) ---
        var ownerId = _currentUser.UserId;
        if (ownerId is null)
            return Result<CreateManagerResponse>.Failure("You must be logged in to create a Manager.");

        var orgId = _currentUser.OrganizationId;
        if (orgId is null)
            return Result<CreateManagerResponse>.Failure("You must belong to an organization to create a Manager.");

        if (!string.Equals(_currentUser.Role, "owner", StringComparison.OrdinalIgnoreCase))
            return Result<CreateManagerResponse>.Failure("Only the organization owner can create Manager users.");

        var fullName = req.FullName.Trim();
        var phone = req.Phone.Trim();
        var email = string.IsNullOrWhiteSpace(req.Email) ? null : req.Email.Trim();
        var stationIds = req.StationIds.Distinct().ToList();

        // --- Step 2: Validate every station belongs to the Owner's org and is active (multi-tenancy guard).
        //              The tenant read here also pins the tenant DbContext so UnitOfWork flushes it. ---
        var stations = await _stationRepo.GetByIdsAsync(stationIds, cancellationToken);
        if (stations.Count != stationIds.Count
            || stations.Any(s => s.OrganizationId != orgId.Value)
            || stations.Any(s => !s.IsActive))
        {
            return Result<CreateManagerResponse>.Failure("One or more stations are invalid or not in your organization.");
        }

        // --- Step 3: Enforce plan user limit (max_users; -1 = unlimited) ---
        var planLimitError = await CheckPlanUserLimitAsync(ownerId.Value, orgId.Value, cancellationToken);
        if (planLimitError != null)
            return Result<CreateManagerResponse>.Failure(planLimitError);

        // --- Step 4: Uniqueness (phone always; email when provided) — mirrors RegisterCommandHandler ---
        var phoneTaken = await _userManager.Users.AsNoTracking()
            .AnyAsync(u => u.PhoneNumber == phone, cancellationToken);
        if (phoneTaken)
            return Result<CreateManagerResponse>.Failure("An account with this phone number already exists.");

        if (email != null)
        {
            var existingEmail = await _userManager.FindByEmailAsync(email);
            if (existingEmail != null)
                return Result<CreateManagerResponse>.Failure("An account with this email already exists.");
        }

        // --- Step 5: Create AppUser (control plane). OrganizationId is mandatory so the Manager's
        //              JWT carries org_id and tenant routing works on their later login. ---
        var now = DateTime.UtcNow;
        var tempPassword = req.RequireOtp ? null : GenerateTemporaryPassword();
        var user = new AppUser
        {
            UserName = phone,
            Email = email,
            PhoneNumber = phone,
            PhoneNumberConfirmed = !req.RequireOtp,
            FullName = fullName,
            OrganizationId = orgId.Value,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now,
        };

        var createResult = tempPassword is null
            ? await _userManager.CreateAsync(user)
            : await _userManager.CreateAsync(user, tempPassword);
        if (!createResult.Succeeded)
        {
            var errors = string.Join(", ", createResult.Errors.Select(e => e.Description));
            return Result<CreateManagerResponse>.Failure($"Failed to create Manager: {errors}");
        }

        // --- Step 6: Assign Manager role; compensate (delete user) on failure ---
        var roleResult = await _userManager.AddToRoleAsync(user, UserRole.Manager.ToString());
        if (!roleResult.Succeeded)
        {
            await SafeDeleteUserAsync(user);
            var errors = string.Join(", ", roleResult.Errors.Select(e => e.Description));
            return Result<CreateManagerResponse>.Failure($"Failed to assign Manager role: {errors}");
        }

        string? code = null;
        try
        {
            // --- Step 7: Stage UserStation rows (tenant) ---
            await _userStationRepo.AddRangeAsync(stationIds.Select(sid => (user.Id, sid)), cancellationToken);

            // --- Step 8: Stage signup OTP (control plane) — only on the OTP-required path ---
            if (req.RequireOtp)
            {
                code = _otpHasher.GenerateCode();
                await _phoneVerifications.AddAsync(new PhoneVerification
                {
                    UserId = user.Id,
                    CodeHash = _otpHasher.Hash(code),
                    ExpiresAt = now.AddMinutes(_otpOptions.TtlMinutes),
                    Purpose = OtpPurpose.Signup,
                    CreatedAt = now,
                    UpdatedAt = now,
                });
            }

            // --- Step 9: Commit both contexts (tenant first, then control plane) ---
            await _unitOfWork.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to persist Manager assignments/OTP for user {UserId}; compensating", user.Id);
            await CompensateAsync(user);
            return Result<CreateManagerResponse>.Failure("Failed to create the Manager. Please try again.");
        }

        // --- Step 10: Send invite SMS (OTP path) — fire-and-forget; do not fail the command ---
        if (req.RequireOtp && code != null)
        {
            try
            {
                await _smsSender.SendSmsAsync(
                    phone,
                    $"You've been added to Fuel Flow. Your verification code is {code}. It expires in {_otpOptions.TtlMinutes} minutes.",
                    cancellationToken);
            }
            catch (Exception smsEx)
            {
                _logger.LogError(smsEx, "Invite SMS dispatch failed for new Manager {UserId}; they can resend the code", user.Id);
            }
        }

        _logger.LogInformation(
            "Manager created: user={UserId} org={OrgId} stations={StationCount} otpRequired={OtpRequired}",
            user.Id, orgId.Value, stationIds.Count, req.RequireOtp);

        return Result<CreateManagerResponse>.Success(new CreateManagerResponse
        {
            UserId = user.Id,
            FullName = fullName,
            Phone = phone,
            OtpRequired = req.RequireOtp,
            TemporaryPassword = tempPassword,
            Message = req.RequireOtp
                ? "Manager created. An SMS verification code was sent so they can set a password and sign in."
                : "Manager created. Share the temporary password shown — they should change it after first sign-in.",
        });
    }

    /// <summary>Returns an error if the org is at/over the plan's user limit (max_users; -1 = unlimited); null if allowed.</summary>
    private async Task<string?> CheckPlanUserLimitAsync(Guid ownerId, Guid organizationId, CancellationToken cancellationToken)
    {
        var subscription = await _subscriptionRepo.GetActiveSubscriptionWithPlanForUserAsync(ownerId, cancellationToken);
        if (subscription == null)
            return null;

        var maxUsers = subscription.Plan.MaxUsers;
        if (maxUsers < 0)
            return null; // unlimited

        var currentCount = await _userManager.Users.AsNoTracking()
            .CountAsync(u => u.OrganizationId == organizationId, cancellationToken);
        if (currentCount >= maxUsers)
            return $"User limit reached for your plan ({maxUsers} user(s)). Upgrade to add more users.";

        return null;
    }

    /// <summary>Best-effort full rollback after a failed multi-context save: remove tenant rows, then delete the AppUser.</summary>
    private async Task CompensateAsync(AppUser user)
    {
        try
        {
            await _userStationRepo.RemoveByUserAsync(user.Id);
            await _unitOfWork.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Compensation: failed to remove UserStation rows for {UserId}", user.Id);
        }
        await SafeDeleteUserAsync(user);
    }

    private async Task SafeDeleteUserAsync(AppUser user)
    {
        try
        {
            await _userManager.DeleteAsync(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Compensation: failed to delete orphan AppUser {UserId}", user.Id);
        }
    }

    /// <summary>Generates a random temporary password that satisfies any reasonable Identity policy (upper/lower/digit/symbol, length 16).</summary>
    private static string GenerateTemporaryPassword()
    {
        var random = Convert.ToBase64String(RandomNumberGenerator.GetBytes(9)); // 12 url-unsafe base64 chars
        return random + "Aa1!"; // guarantee an upper, lower, digit, and symbol
    }
}
