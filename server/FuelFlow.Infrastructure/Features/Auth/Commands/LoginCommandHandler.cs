using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.Auth;
using FuelFlow.Application.Features.Auth.Commands;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Application.Interfaces.Services;
using FuelFlow.Domain.Entities;
using StationEntity = FuelFlow.Domain.Entities.Station;
using FuelFlow.Infrastructure.Identity;
using FuelFlow.Infrastructure.Services;

namespace FuelFlow.Infrastructure.Features.Auth.Commands;

/// <summary>
/// CQRS Handler: Authenticates user with email/password.
/// Issues a new refresh token (rotation), loads org/stations/subscription when user is onboarded,
/// and returns <see cref="AuthResponse"/> (tokens, UserInfo, optional Org/Stations/Subscription).
/// Pre-onboarding users get tokens and user info only (no org/stations/subscription).
/// M14 contract: ControlPlane for pre-onboarding users (!user.OrganizationId.HasValue guard); tenant repos only when org_id is present [M14-F05-R02].
/// </summary>
public class LoginCommandHandler : IRequestHandler<LoginCommand, Result<AuthResponse>>
{
    private readonly UserManager<AppUser> _userManager;
    private readonly IOrganizationRepository _organizationRepo;
    private readonly IStationRepository _stationRepo;
    private readonly IUserStationRepository _userStationRepo;
    private readonly ISubscriptionRepository _subscriptionRepo;
    private readonly IRefreshTokenRepository _refreshTokenRepo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly JwtTokenService _jwtTokenService;
    private readonly IRequestContextService _requestContext;
    private readonly IOnboardingBypassFlagProvider _bypassFlagProvider;

    public LoginCommandHandler(
        UserManager<AppUser> userManager,
        IOrganizationRepository organizationRepo,
        IStationRepository stationRepo,
        IUserStationRepository userStationRepo,
        ISubscriptionRepository subscriptionRepo,
        IRefreshTokenRepository refreshTokenRepo,
        IUnitOfWork unitOfWork,
        JwtTokenService jwtTokenService,
        IRequestContextService requestContext,
        IOnboardingBypassFlagProvider bypassFlagProvider)
    {
        _userManager = userManager;
        _organizationRepo = organizationRepo;
        _stationRepo = stationRepo;
        _userStationRepo = userStationRepo;
        _subscriptionRepo = subscriptionRepo;
        _refreshTokenRepo = refreshTokenRepo;
        _unitOfWork = unitOfWork;
        _jwtTokenService = jwtTokenService;
        _requestContext = requestContext;
        _bypassFlagProvider = bypassFlagProvider;
    }

    /// <summary>
    /// Handles login: validates credentials, issues refresh token, then returns auth response
    /// (pre-onboarding: tokens + user only; post-onboarding: tokens + user + org + stations + subscription).
    /// </summary>
    public async Task<Result<AuthResponse>> Handle(
        LoginCommand request,
        CancellationToken cancellationToken)
    {
        var req = request.Request;
        var identifier = req.Identifier?.Trim() ?? string.Empty;
        var isEmailIdentifier = identifier.Contains('@');

        // --- Step 1: Resolve user by phone (primary) or verified email (fallback per [M01-F09-R05]) ---
        AppUser? user;
        if (isEmailIdentifier)
        {
            var byEmail = await _userManager.FindByEmailAsync(identifier);
            // Email-based resolution requires EmailConfirmed per R05; otherwise pretend the user doesn't exist.
            user = (byEmail != null && byEmail.EmailConfirmed) ? byEmail : null;
        }
        else
        {
            user = await _userManager.Users
                .FirstOrDefaultAsync(u => u.PhoneNumber == identifier, cancellationToken);
        }

        if (user == null || !user.IsActive)
            return Result<AuthResponse>.Failure("Invalid credentials.");

        var userRole = await _userManager.GetRolesAsync(user);
        if (userRole.Count == 0)
            return Result<AuthResponse>.Failure("User has no role assigned.");

        var passwordValid = await _userManager.CheckPasswordAsync(user, req.Password);
        if (!passwordValid)
            return Result<AuthResponse>.Failure("Invalid credentials.");

        // Universal phone-verification gate per [M01-F09-R03] — applies regardless of which identifier was used.
        // Prefix is a stable machine-readable marker the frontend uses to offer a "Resend OTP" affordance.
        if (!user.PhoneNumberConfirmed)
            return Result<AuthResponse>.Failure("phone_verification_required: Please verify your phone number before signing in. Tap the resend link to receive a new code.");

        // --- Step 2: Issue and persist new refresh token (rotation: one-time use per token) ---
        var plainRefreshToken = _jwtTokenService.GenerateRefreshToken();
        var refreshTokenEntity = new RefreshToken
        {
            UserId = user.Id,
            TokenHash = _jwtTokenService.HashRefreshToken(plainRefreshToken),
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            IpAddress = _requestContext.ClientIp,
            UserAgent = _requestContext.UserAgent,
            DeviceId = !string.IsNullOrWhiteSpace(req.DeviceId) ? req.DeviceId.Trim() : null,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
        await _refreshTokenRepo.AddAsync(refreshTokenEntity);
        await _unitOfWork.SaveChangesAsync();

        // --- Step 3: Build response (pre-onboarding vs post-onboarding) ---
        if (!user.OrganizationId.HasValue)
            return Result<AuthResponse>.Success(BuildAuthResponse(user, userRole, plainRefreshToken));

        // User has org: load org (with stations) and resolve user's stations + active subscription
        var organization = await _organizationRepo.GetByIdWithStationsAsync(user.OrganizationId.Value, cancellationToken);
        if (organization == null)
            return Result<AuthResponse>.Failure("Organization not found.");

        var stations = await GetStationsForUserAsync(user.Id, organization.Id, cancellationToken, organization);
        var subscription = await _subscriptionRepo.GetActiveSubscriptionForUserAsync(user.Id, cancellationToken);

        return Result<AuthResponse>.Success(BuildAuthResponse(user, userRole, plainRefreshToken, organization, stations, subscription));
    }

    /// <summary>
    /// Resolves the station list for the user: if the user has station assignments (user_stations),
    /// returns those stations; otherwise returns all active stations for the organization.
    /// When <paramref name="orgWithStations"/> is provided, uses its loaded Stations to avoid an extra DB query.
    /// </summary>
    private async Task<List<StationEntity>> GetStationsForUserAsync(Guid userId, Guid organizationId, CancellationToken cancellationToken, Organization? orgWithStations = null)
    {
        var stationIds = await _userStationRepo.GetStationIdsByUserIdAsync(userId, cancellationToken);
        if (stationIds.Count > 0)
            return await _stationRepo.GetByIdsAsync(stationIds, cancellationToken);
        if (orgWithStations?.Stations != null)
            return orgWithStations.Stations.Where(s => s.IsActive).ToList();
        return await _stationRepo.GetByOrganizationIdAsync(organizationId);
    }

    /// <summary>
    /// Builds the auth response DTO: access token, refresh token, expiry, user info,
    /// and optionally organization, stations, and subscription (null when pre-onboarding).
    /// </summary>
    private AuthResponse BuildAuthResponse(
        AppUser user,
        IList<string> userRoles,
        string refreshToken,
        Organization? org = null,
        List<StationEntity>? stations = null,
        SubscriptionInfo? subscription = null)
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
            Organization = org != null ? new OrganizationInfo { Id = org.Id, Name = org.Name } : null,
            Stations = stations?.Select(s => new StationInfo { Id = s.Id, Name = s.Name, IsSetupComplete = s.IsSetupComplete, AcceptedPaymentMethods = s.AcceptedPaymentMethods }).ToList(),
            Subscription = subscription,
            DevBypassActive = _bypassFlagProvider.IsActive,
        };
    }
}
