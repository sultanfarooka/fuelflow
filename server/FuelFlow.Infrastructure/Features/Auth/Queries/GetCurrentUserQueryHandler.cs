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
/// CQRS Handler: Returns the current authenticated user's profile (UserInfo, Stations, Subscription).
/// Used by GET /me or similar. Stations come from user_stations when assigned, else org's stations.
/// </summary>
public class GetCurrentUserQueryHandler : IRequestHandler<GetCurrentUserQuery, Result<AuthResponse>>
{
    // Dependencies: Identity, org/station/subscription repos, JWT for new access token in response
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

    public async Task<Result<AuthResponse>> Handle(
        GetCurrentUserQuery request,
        CancellationToken cancellationToken)
    {
        // 1. Load user; reject if missing or inactive
        var user = await _userManager.FindByIdAsync(request.UserId.ToString());
        if (user == null || !user.IsActive)
            return Result<AuthResponse>.Failure("User not found.");

        // 2. User without org (pre-onboarding): return profile with empty stations, optional subscription
        if (!user.OrganizationId.HasValue)
        {
            return Result<AuthResponse>.Success(await BuildAuthResponseWithoutOrgAsync(user, cancellationToken));
        }

        // 3. Load organization; reject if missing
        var organization = await _organizationRepo.GetByIdAsync(user.OrganizationId.Value);
        if (organization == null)
            return Result<AuthResponse>.Failure("Organization not found.");

        // 4. Resolve stations (assigned via user_stations, or fallback to org stations) and active subscription
        var stations = await GetStationsForUserAsync(user.Id, organization.Id, cancellationToken);
        var subscription = await _subscriptionRepo.GetActiveSubscriptionForUserAsync(user.Id, cancellationToken);

        return Result<AuthResponse>.Success(
            BuildAuthResponse(user, organization, stations, subscription));
    }

    /// <summary>Builds auth response for user without organization (pre-onboarding). Stations empty; subscription if any.</summary>
    private async Task<AuthResponse> BuildAuthResponseWithoutOrgAsync(AppUser user, CancellationToken cancellationToken)
    {
        var subscription = await _subscriptionRepo.GetActiveSubscriptionForUserAsync(user.Id, cancellationToken);
        return new AuthResponse
        {
            AccessToken = _jwtTokenService.GenerateAccessToken(user),
            RefreshToken = _jwtTokenService.GenerateRefreshToken(),
            ExpiresIn = _jwtTokenService.GetExpiresInSeconds(),
            User = new UserInfo
            {
                Id = user.Id,
                Email = user.Email!,
                FullName = user.FullName,
                Role = user.Role.ToString().ToLower(),
                Stations = new List<StationInfo>(),
            },
            Subscription = subscription,
        };
    }

    /// <summary>Returns stations for user: assigned via user_stations if any, else all org stations.</summary>
    private async Task<List<StationEntity>> GetStationsForUserAsync(Guid userId, Guid organizationId, CancellationToken cancellationToken)
    {
        var stationIds = await _userStationRepo.GetStationIdsByUserIdAsync(userId, cancellationToken);
        if (stationIds.Count > 0)
            return await _stationRepo.GetByIdsAsync(stationIds, cancellationToken);
        return await _stationRepo.GetByOrganizationIdAsync(organizationId);
    }

    /// <summary>Builds full auth response with user info, station list, and subscription (for user with org).</summary>
    private AuthResponse BuildAuthResponse(
        AppUser user,
        Organization org,
        List<StationEntity> stations,
        SubscriptionInfo? subscription)
    {
        return new AuthResponse
        {
            AccessToken = _jwtTokenService.GenerateAccessToken(user),
            RefreshToken = _jwtTokenService.GenerateRefreshToken(),
            ExpiresIn = _jwtTokenService.GetExpiresInSeconds(),
            User = new UserInfo
            {
                Id = user.Id,
                Email = user.Email!,
                FullName = user.FullName,
                Role = user.Role.ToString().ToLower(),
                Stations = stations.Select(s => new StationInfo { Id = s.Id, Name = s.Name }).ToList(),
            },
            Subscription = subscription,
        };
    }
}
