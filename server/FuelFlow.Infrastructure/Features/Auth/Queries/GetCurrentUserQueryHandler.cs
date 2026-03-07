using MediatR;
using Microsoft.AspNetCore.Identity;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.Auth;
using FuelFlow.Application.Features.Auth.Queries;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Domain.Entities;
using StationEntity = FuelFlow.Domain.Entities.Station;
using FuelFlow.Infrastructure.Identity;
using FuelFlow.Infrastructure.Services;

namespace FuelFlow.Infrastructure.Features.Auth.Queries;

/// <summary>
/// CQRS Handler: Returns the current authenticated user's profile (GET /me).
/// Loads user by ID from the request (set by auth middleware), then returns the same
/// <see cref="AuthResponse"/> shape as login: tokens (new access + new refresh), UserInfo,
/// and when onboarded: Organization, Stations, Subscription. Used to refresh client state after login.
/// </summary>
public class GetCurrentUserQueryHandler : IRequestHandler<GetCurrentUserQuery, Result<AuthResponse>>
{
    private readonly UserManager<AppUser> _userManager;
    private readonly IOrganizationRepository _organizationRepo;
    private readonly IStationRepository _stationRepo;
    private readonly IUserStationRepository _userStationRepo;
    private readonly ISubscriptionRepository _subscriptionRepo;
    private readonly JwtTokenService _jwtTokenService;

    public GetCurrentUserQueryHandler(
        UserManager<AppUser> userManager,
        IOrganizationRepository organizationRepo,
        IStationRepository stationRepo,
        IUserStationRepository userStationRepo,
        ISubscriptionRepository subscriptionRepo,
        JwtTokenService jwtTokenService)
    {
        _userManager = userManager;
        _organizationRepo = organizationRepo;
        _stationRepo = stationRepo;
        _userStationRepo = userStationRepo;
        _subscriptionRepo = subscriptionRepo;
        _jwtTokenService = jwtTokenService;
    }

    /// <summary>
    /// Loads current user by ID (from auth context), then returns auth response with new tokens
    /// and profile (pre-onboarding: user only; post-onboarding: user + org + stations + subscription).
    /// </summary>
    public async Task<Result<AuthResponse>> Handle(
        GetCurrentUserQuery request,
        CancellationToken cancellationToken)
    {
        // --- Step 1: Load user and roles; reject if missing or inactive ---
        var user = await _userManager.FindByIdAsync(request.UserId.ToString());
        if (user == null || !user.IsActive)
            return Result<AuthResponse>.Failure("User not found.");

        var userRole = await _userManager.GetRolesAsync(user);
        if (userRole.Count == 0)
            return Result<AuthResponse>.Failure("User has no role assigned.");

        // --- Step 2: Pre-onboarding: return tokens + user only (no org/stations/subscription) ---
        if (!user.OrganizationId.HasValue)
            return Result<AuthResponse>.Success(BuildAuthResponse(user, userRole));

        // --- Step 3: Load organization (with stations) for onboarded user ---
        var organization = await _organizationRepo.GetByIdWithStationsAsync(user.OrganizationId.Value, cancellationToken);
        if (organization == null)
            return Result<AuthResponse>.Failure("Organization not found.");

        // --- Step 4: Resolve user's stations and active subscription; build full response ---
        var stations = await GetStationsForUserAsync(user.Id, organization.Id, cancellationToken, organization);
        var subscription = await _subscriptionRepo.GetActiveSubscriptionForUserAsync(user.Id, cancellationToken);

        return Result<AuthResponse>.Success(BuildAuthResponse(user, userRole, organization, stations, subscription));
    }

    /// <summary>
    /// Resolves the station list for the user: assigned stations (user_stations) or all org stations.
    /// When <paramref name="orgWithStations"/> is provided, uses its Stations to avoid an extra query.
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
    /// Builds the auth response: new access + new refresh token, user info, and optionally
    /// org/stations/subscription (null when pre-onboarding). Refresh token is generated here (no incoming token).
    /// </summary>
    private AuthResponse BuildAuthResponse(
        AppUser user,
        IList<string> userRoles,
        Organization? org = null,
        List<StationEntity>? stations = null,
        SubscriptionInfo? subscription = null)
    {
        return new AuthResponse
        {
            AccessToken = _jwtTokenService.GenerateAccessToken(user, userRoles),
            RefreshToken = _jwtTokenService.GenerateRefreshToken(),
            ExpiresIn = _jwtTokenService.GetExpiresInSeconds(),
            User = new UserInfo
            {
                Id = user.Id,
                Email = user.Email!,
                FullName = user.FullName,
                Roles = userRoles.Select(r => r.ToLower()).ToList(),
            },
            Organization = org != null ? new OrganizationInfo { Id = org.Id, Name = org.Name } : null,
            Stations = stations?.Select(s => new StationInfo { Id = s.Id, Name = s.Name }).ToList(),
            Subscription = subscription,
        };
    }
}
