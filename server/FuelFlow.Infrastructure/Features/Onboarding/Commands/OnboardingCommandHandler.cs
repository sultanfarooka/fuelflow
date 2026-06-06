using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.Auth;
using FuelFlow.Application.Features.Onboarding.Commands;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Application.Interfaces.Services;
using FuelFlow.Domain.Entities;
using FuelFlow.Domain.Enums;
using StationEntity = FuelFlow.Domain.Entities.Station;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using FuelFlow.Infrastructure.Data;
using FuelFlow.Infrastructure.Identity;
using FuelFlow.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace FuelFlow.Infrastructure.Features.Onboarding.Commands;

/// <summary>
/// Handles onboarding step 1: provision a tenant database, link the user, create the first station,
/// and issue a new JWT that carries the org_id claim so subsequent wizard steps route to the tenant DB.
///
/// WHY direct AppDbContext (not TenantDbContextAccessor): the current request's JWT has no org_id yet,
/// so TenantConnectionResolver.ResolveAsync returns null. All tenant DB writes use a fresh AppDbContext
/// opened against the just-provisioned tenant connection string.
/// </summary>
public class OnboardingCommandHandler : IRequestHandler<OnboardingCommand, Result<AuthResponse>>
{
    private readonly ICurrentUserService _currentUser;
    private readonly UserManager<AppUser> _userManager;
    private readonly ITenantProvisioningService _tenantProvisioningService;
    private readonly ISubscriptionRepository _subscriptionRepo;
    private readonly ISubscriptionPlanRepository _subscriptionPlanRepo;
    private readonly IRefreshTokenRepository _refreshTokenRepo;
    private readonly JwtTokenService _jwtTokenService;
    private readonly IRequestContextService _requestContext;
    private readonly IOMCRepository _omcRepo;
    private readonly IConfiguration _configuration;
    private readonly ControlPlaneDbContext _controlPlane;
    private readonly ILogger<OnboardingCommandHandler> _logger;

    private const SubscriptionPlanName TrialPlan = SubscriptionPlanName.Professional;

    public OnboardingCommandHandler(
        ICurrentUserService currentUser,
        UserManager<AppUser> userManager,
        ITenantProvisioningService tenantProvisioningService,
        ISubscriptionRepository subscriptionRepo,
        ISubscriptionPlanRepository subscriptionPlanRepo,
        IRefreshTokenRepository refreshTokenRepo,
        JwtTokenService jwtTokenService,
        IRequestContextService requestContext,
        IOMCRepository omcRepo,
        IConfiguration configuration,
        ControlPlaneDbContext controlPlane,
        ILogger<OnboardingCommandHandler> logger)
    {
        _currentUser = currentUser;
        _userManager = userManager;
        _tenantProvisioningService = tenantProvisioningService;
        _subscriptionRepo = subscriptionRepo;
        _subscriptionPlanRepo = subscriptionPlanRepo;
        _refreshTokenRepo = refreshTokenRepo;
        _jwtTokenService = jwtTokenService;
        _requestContext = requestContext;
        _omcRepo = omcRepo;
        _configuration = configuration;
        _controlPlane = controlPlane;
        _logger = logger;
    }

    public async Task<Result<AuthResponse>> Handle(OnboardingCommand request, CancellationToken cancellationToken)
    {
        var req = request.Request;

        // --- Guard: validate prerequisites ---
        var userId = _currentUser.UserId!.Value;
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
            return Result<AuthResponse>.Failure("User not found.");

        var omc = await _omcRepo.GetByIdAsync(req.OMCId, cancellationToken);
        if (omc == null)
            return Result<AuthResponse>.Failure("OMC not found.");

        if (user.OrganizationId.HasValue)
            return Result<AuthResponse>.Failure("Already onboarded.");

        // --- Step 1: Provision tenant database ---
        // ProvisionAsync: inserts Tenant row (Provisioning), CREATE DATABASE, MigrateAsync,
        // inserts Organization row, flips Tenant.Status Active.
        // On failure it compensates (DROP DATABASE, delete Tenant row) and re-throws.
        var orgId = Guid.NewGuid();
        try
        {
            await _tenantProvisioningService.ProvisionAsync(
                orgId, req.OrganizationName.Trim(), userId, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Tenant provisioning failed for user {UserId}", userId);
            return Result<AuthResponse>.Failure("Failed to provision your workspace. Please try again.");
        }

        // --- Step 2: Link user to the new organization ---
        user.OrganizationId = orgId;
        var updateResult = await _userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            _logger.LogError("Failed to set OrganizationId on user {UserId}: {Errors}",
                userId, string.Join(", ", updateResult.Errors.Select(e => e.Description)));
            return Result<AuthResponse>.Failure("Failed to link user to the new organization.");
        }

        // --- Step 3: Build a direct tenant AppDbContext (JWT has no org_id yet) ---
        var baseConnStr = _configuration.GetConnectionString("DefaultConnection")!;
        var tenantConnStr = new NpgsqlConnectionStringBuilder(baseConnStr)
        {
            Database = $"tenant_{orgId:N}"
        }.ToString();

        var tenantOptions = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(tenantConnStr,
                npgsql => npgsql.MigrationsHistoryTable("__EFMigrationsHistory_AppDb"))
            .Options;

        var now = DateTime.UtcNow;
        StationEntity? station = null;

        try
        {
            await using var tenantCtx = new AppDbContext(tenantOptions);

            // --- Step 4: Create first station ---
            station = new StationEntity
            {
                Name = req.StationName.Trim(),
                Address = string.IsNullOrWhiteSpace(req.Address) ? null : req.Address.Trim(),
                Phone = string.IsNullOrWhiteSpace(req.Phone) ? null : req.Phone.Trim(),
                LogoUrl = string.IsNullOrWhiteSpace(req.LogoUrl) ? null : req.LogoUrl.Trim(),
                IsActive = true,
                OrganizationId = orgId,
                OMCId = omc.Id,
                CreatedAt = now,
                UpdatedAt = now,
            };
            tenantCtx.Stations.Add(station);
            await tenantCtx.SaveChangesAsync(cancellationToken);

            // --- Step 4b: Seed default expense account heads (M05-F09-R03) ---
            // Seeded inline into the just-provisioned tenant DB because the current
            // request's JWT has no org_id yet, so TenantDbContextAccessor cannot
            // resolve the tenant connection. Best-effort: a seeding failure must not
            // fail an otherwise-successful onboarding.
            try
            {
                var heads = AccountHeadSeeder.DefaultExpenseHeadNames
                    .Select(name => AccountHeadSeeder.BuildExpenseHead(orgId, name))
                    .ToList();
                await tenantCtx.AccountHeads.AddRangeAsync(heads, cancellationToken);
                await tenantCtx.SaveChangesAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to seed default expense account heads for org {OrgId}", orgId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create first station during onboarding for org {OrgId}", orgId);
            return Result<AuthResponse>.Failure("Workspace created but failed to create the first station.");
        }

        // --- Step 5: Optional trial subscription (control plane) ---
        try
        {
            var existingSubscription = await _subscriptionRepo.GetActiveSubscriptionForUserAsync(userId, cancellationToken);
            if (existingSubscription == null)
            {
                var trialPlan = await _subscriptionPlanRepo.GetByNameAsync(TrialPlan.ToString(), cancellationToken);
                if (trialPlan != null)
                {
                    await _subscriptionRepo.AddAsync(new Subscription
                    {
                        UserId = userId,
                        PlanId = trialPlan.Id,
                        Status = SubscriptionStatus.Trial,
                        StartedAt = now,
                        EndsAt = now.AddDays(14),
                        CreatedAt = now,
                        UpdatedAt = now,
                    }, cancellationToken);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to create trial subscription for org {OrgId}; continuing", orgId);
        }

        // --- Step 6: Issue new refresh token (control plane) ---
        var plainRefreshToken = _jwtTokenService.GenerateRefreshToken();
        await _refreshTokenRepo.AddAsync(new RefreshToken
        {
            UserId = userId,
            TokenHash = _jwtTokenService.HashRefreshToken(plainRefreshToken),
            ExpiresAt = now.AddDays(7),
            IpAddress = _requestContext.ClientIp,
            UserAgent = _requestContext.UserAgent,
            DeviceId = null,
            CreatedAt = now,
            UpdatedAt = now,
        });

        // Flush subscription + refresh token to control plane.
        // Inject ControlPlaneDbContext directly — cannot use UnitOfWork here because the
        // JWT still has no org_id (the new token is issued below), so UnitOfWork.SaveChangesAsync
        // would attempt to resolve the tenant context and throw.

        try
        {
            await _controlPlane.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to persist refresh token for user {UserId}", userId);
            return Result<AuthResponse>.Failure("Workspace created but failed to issue session token.");
        }

        // --- Step 7: Build auth response with new access token (org_id now embedded) ---
        var userRoles = await _userManager.GetRolesAsync(user);
        if (userRoles.Count == 0)
            return Result<AuthResponse>.Failure("User has no role assigned.");

        var subscription = await _subscriptionRepo.GetActiveSubscriptionForUserAsync(userId, cancellationToken);

        return Result<AuthResponse>.Success(new AuthResponse
        {
            AccessToken = _jwtTokenService.GenerateAccessToken(user, userRoles),
            RefreshToken = plainRefreshToken,
            ExpiresIn = _jwtTokenService.GetExpiresInSeconds(),
            User = new UserInfo
            {
                Id = user.Id,
                Email = user.Email,
                Phone = user.PhoneNumber,
                FullName = user.FullName,
                Roles = userRoles.Select(r => r.ToLower()).ToList(),
            },
            Organization = new OrganizationInfo { Id = orgId, Name = req.OrganizationName.Trim() },
            Stations = [new StationInfo
            {
                Id = station!.Id,
                Name = station.Name,
                IsSetupComplete = station.IsSetupComplete,
                AcceptedPaymentMethods = station.AcceptedPaymentMethods,
            }],
            Subscription = subscription,
        });
    }
}
