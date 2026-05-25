using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.Auth;
using FuelFlow.Application.Features.Onboarding.Commands;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Application.Interfaces.Services;
using FuelFlow.Domain.Entities;
using FuelFlow.Domain.Enums;
using StationEntity = FuelFlow.Domain.Entities.Station;
using FuelTypeEntity = FuelFlow.Domain.Entities.FuelType;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using FuelFlow.Infrastructure.Identity;
using FuelFlow.Infrastructure.Services;


namespace FuelFlow.Infrastructure.Features.Onboarding.Commands;

/// <summary>
/// Handles onboarding for a user who has no organization yet (post-registration, pre-onboarding).
/// In a single transaction: creates the organization, links it to the current user, creates the first station,
/// optionally assigns a trial subscription, and issues a new refresh token. Then returns the same
/// <see cref="AuthResponse"/> shape as login so the client can set cookies and continue with org_id in the token.
/// </summary>
public class OnboardingCommandHandler : IRequestHandler<OnboardingCommand, Result<AuthResponse>>
{
    private readonly ICurrentUserService _currentUser;
    private readonly UserManager<AppUser> _userManager;
    private readonly IOrganizationRepository _organizationRepository;
    private readonly IStationRepository _stationRepo;
    private readonly ISubscriptionRepository _subscriptionRepo;
    private readonly ISubscriptionPlanRepository _subscriptionPlanRepo;
    private readonly IRefreshTokenRepository _refreshTokenRepo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly JwtTokenService _jwtTokenService;
    private readonly IRequestContextService _requestContext;
    private readonly IOMCRepository _omcRepo;
    private readonly IOMCFuelTypeRepository _omcFuelTypeRepo;
    private readonly IFuelTypeRepository _fuelTypeRepo;
    private readonly ILogger<OnboardingCommandHandler> _logger;

    /// <summary>Plan used for the 14-day trial (Professional features).</summary>
    private const SubscriptionPlanName TrialPlan = SubscriptionPlanName.Professional;

    public OnboardingCommandHandler(
        ICurrentUserService currentUser,
        UserManager<AppUser> userManager,
        IOrganizationRepository organizationRepository,
        IStationRepository stationRepo,
        ISubscriptionRepository subscriptionRepo,
        ISubscriptionPlanRepository subscriptionPlanRepo,
        IRefreshTokenRepository refreshTokenRepo,
        IUnitOfWork unitOfWork,
        JwtTokenService jwtTokenService,
        IRequestContextService requestContext,
        IOMCRepository omcRepo,
        IOMCFuelTypeRepository omcFuelTypeRepo,
        IFuelTypeRepository fuelTypeRepo,
        ILogger<OnboardingCommandHandler> logger)
    {
        _currentUser = currentUser;
        _userManager = userManager;
        _organizationRepository = organizationRepository;
        _stationRepo = stationRepo;
        _subscriptionRepo = subscriptionRepo;
        _subscriptionPlanRepo = subscriptionPlanRepo;
        _refreshTokenRepo = refreshTokenRepo;
        _unitOfWork = unitOfWork;
        _jwtTokenService = jwtTokenService;
        _requestContext = requestContext;
        _omcRepo = omcRepo;
        _omcFuelTypeRepo = omcFuelTypeRepo;
        _fuelTypeRepo = fuelTypeRepo;
        _logger = logger;
    }

    /// <summary>
    /// Runs onboarding in a transaction: create org, link user, optional trial, first station, refresh token.
    /// After commit, builds and returns auth response (same shape as login) so the client can refresh its tokens and context.
    /// </summary>
    public async Task<Result<AuthResponse>> Handle(OnboardingCommand request, CancellationToken cancellationToken)
    {
        var req = request.Request;

        // --- Step 1: Resolve current user and validate request (OMC exists, user not already onboarded) ---
        var userId = _currentUser.UserId!.Value;
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
            return Result<AuthResponse>.Failure("User not found.");

        var omc = await _omcRepo.GetByIdAsync(req.OMCId, cancellationToken);
        if (omc == null)
            return Result<AuthResponse>.Failure("OMC not found.");

        if (user.OrganizationId.HasValue)
            return Result<AuthResponse>.Failure("Already onboarded.");

        var plainRefreshToken = _jwtTokenService.GenerateRefreshToken();
        Organization newOrganization;
        try
        {
            await _unitOfWork.BeginTransactionAsync();

            // --- Step 2: Create organization and link to user (Owner) ---
            newOrganization = new Organization
            {
                Name = req.OrganizationName.Trim(),
                OwnerId = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            await _organizationRepository.AddAsync(newOrganization);
            await _unitOfWork.SaveChangesAsync();

            user.OrganizationId = newOrganization.Id;
            await _userManager.UpdateAsync(user);

            // --- Step 3: Optionally create trial subscription (if user has none) ---
            var existingSubscription = await _subscriptionRepo.GetActiveSubscriptionForUserAsync(userId, cancellationToken);
            if (existingSubscription == null)
            {
                var trialPlan = await _subscriptionPlanRepo.GetByNameAsync(TrialPlan.ToString(), cancellationToken);
                if (trialPlan != null)
                {
                    var trialEndsAt = DateTime.UtcNow.AddDays(14);
                    var trialSubscription = new Subscription
                    {
                        UserId = user.Id,
                        PlanId = trialPlan.Id,
                        Status = SubscriptionStatus.Trial,
                        StartedAt = DateTime.UtcNow,
                        EndsAt = trialEndsAt,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                    };
                    await _subscriptionRepo.AddAsync(trialSubscription, cancellationToken);
                }
            }

            // --- Step 4: Create first station for the organization ---
            var station = new StationEntity
            {
                Name = req.StationName.Trim(),
                Address = string.IsNullOrWhiteSpace(req.Address) ? null : req.Address.Trim(),
                Phone = string.IsNullOrWhiteSpace(req.Phone) ? null : req.Phone.Trim(),
                LogoUrl = string.IsNullOrWhiteSpace(req.LogoUrl) ? null : req.LogoUrl.Trim(),
                IsActive = true,
                OrganizationId = newOrganization.Id,
                OMCId = omc.Id,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };
            await _stationRepo.AddAsync(station);

            // --- Step 5: Issue and persist new refresh token (client will use it with new access token) ---
            var refreshTokenEntity = new RefreshToken
            {
                UserId = user.Id,
                TokenHash = _jwtTokenService.HashRefreshToken(plainRefreshToken),
                ExpiresAt = DateTime.UtcNow.AddDays(7),
                IpAddress = _requestContext.ClientIp,
                UserAgent = _requestContext.UserAgent,
                DeviceId = null,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };
            await _refreshTokenRepo.AddAsync(refreshTokenEntity);

            await _unitOfWork.SaveChangesAsync();
            await _unitOfWork.CommitAsync();

            // Add OMC fuel types to the station
            var omcFuelTypes = await _omcFuelTypeRepo.GetByOMCIdAsync(omc.Id, cancellationToken);
            foreach (var fuelType in omcFuelTypes)
            {
                var fuelTypeEntity = new FuelTypeEntity
                {
                    Name = fuelType.Name,
                    Unit = fuelType.Unit,
                    IsCustom = false,
                    OMCId = omc.Id,
                    StationId = station.Id,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                };
                await _fuelTypeRepo.AddAsync(fuelTypeEntity);
            }
            await _unitOfWork.SaveChangesAsync();

        }
        catch (Exception ex)
        {
            await _unitOfWork.RollbackAsync();
            _logger.LogError(ex, "Failed to complete onboarding for user {UserId}", userId);
            return Result<AuthResponse>.Failure("Failed to complete onboarding.");
        }

        // --- Step 6: Load roles and build auth response (same pattern as Login/Refresh) ---
        var userRole = await _userManager.GetRolesAsync(user);
        if (userRole.Count == 0)
            return Result<AuthResponse>.Failure("User has no role assigned.");

        var stations = await _stationRepo.GetByOrganizationIdAsync(newOrganization.Id);
        var subscription = await _subscriptionRepo.GetActiveSubscriptionForUserAsync(user.Id, cancellationToken);

        var authResponse = BuildAuthResponse(user, userRole, plainRefreshToken, newOrganization, stations, subscription);
        return Result<AuthResponse>.Success(authResponse);
    }

    /// <summary>
    /// Builds the auth response DTO (same shape as Login/Refresh): tokens, user, org, stations, subscription.
    /// After onboarding, org and stations are always present; subscription may be null if no trial was created.
    /// </summary>
    private AuthResponse BuildAuthResponse(
        AppUser user,
        IList<string> userRoles,
        string refreshToken,
        Organization org,
        List<StationEntity> stations,
        SubscriptionInfo? subscription)
    {
        return new AuthResponse
        {
            AccessToken = _jwtTokenService.GenerateAccessToken(user, userRoles),
            RefreshToken = refreshToken,
            ExpiresIn = _jwtTokenService.GetExpiresInSeconds(),
            User = new UserInfo
            {
                Id = user.Id,
                Email = user.Email,
                Phone = user.PhoneNumber,
                FullName = user.FullName,
                Roles = userRoles.Select(r => r.ToLower()).ToList(),
            },
            Organization = new OrganizationInfo { Id = org.Id, Name = org.Name },
            Stations = stations.Select(s => new StationInfo { Id = s.Id, Name = s.Name }).ToList(),
            Subscription = subscription,
        };
    }
}
