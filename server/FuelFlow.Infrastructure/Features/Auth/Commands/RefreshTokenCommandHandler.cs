using MediatR;
using Microsoft.AspNetCore.Identity;
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
/// CQRS Handler: Exchanges a valid refresh token for new access + refresh tokens (rotation).
/// Validates the incoming token (exists, not revoked, not expired), revokes it, creates a new one
/// and links the old to the new for audit. Returns the same <see cref="AuthResponse"/> shape as login.
/// </summary>
public class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, Result<AuthResponse>>
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

    public RefreshTokenCommandHandler(
        UserManager<AppUser> userManager,
        IOrganizationRepository organizationRepo,
        IStationRepository stationRepo,
        IUserStationRepository userStationRepo,
        ISubscriptionRepository subscriptionRepo,
        IRefreshTokenRepository refreshTokenRepo,
        IUnitOfWork unitOfWork,
        JwtTokenService jwtTokenService,
        IRequestContextService requestContext)
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
    }

    /// <summary>
    /// Handles refresh: validates token, rotates to a new one, revokes the old, then returns
    /// auth response (same shape as login; pre-onboarding vs post-onboarding).
    /// </summary>
    public async Task<Result<AuthResponse>> Handle(
        RefreshTokenCommand request,
        CancellationToken cancellationToken)
    {
        // --- Step 1: Validate incoming refresh token (present, found by hash, not revoked, not expired) ---
        var refreshToken = request.Request.RefreshToken?.Trim();
        if (string.IsNullOrEmpty(refreshToken))
            return Result<AuthResponse>.Failure("Refresh token is required.");

        var tokenHash = _jwtTokenService.HashRefreshToken(refreshToken);
        var existingToken = await _refreshTokenRepo.GetByTokenHashAsync(tokenHash);
        if (existingToken == null)
            return Result<AuthResponse>.Failure("Invalid refresh token.");

        if (existingToken.RevokedAt != null)
            return Result<AuthResponse>.Failure("Refresh token has been revoked. Please log in again.");

        if (existingToken.ExpiresAt < DateTime.UtcNow)
            return Result<AuthResponse>.Failure("Refresh token has expired. Please log in again.");

        // --- Step 2: Load user and roles; reject if missing or inactive ---
        var user = await _userManager.FindByIdAsync(existingToken.UserId.ToString());
        if (user == null || !user.IsActive)
            return Result<AuthResponse>.Failure("User not found or inactive.");

        var userRole = await _userManager.GetRolesAsync(user);
        if (userRole.Count == 0)
            return Result<AuthResponse>.Failure("User has no role assigned.");

        // --- Step 3: Create and persist new refresh token (rotation: one-time use per token) ---
        var newPlainToken = _jwtTokenService.GenerateRefreshToken();
        var newTokenEntity = new RefreshToken
        {
            UserId = user.Id,
            TokenHash = _jwtTokenService.HashRefreshToken(newPlainToken),
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            IpAddress = _requestContext.ClientIp,
            UserAgent = _requestContext.UserAgent,
            DeviceId = !string.IsNullOrWhiteSpace(request.Request.DeviceId) ? request.Request.DeviceId.Trim() : null,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
        await _refreshTokenRepo.AddAsync(newTokenEntity);
        await _unitOfWork.SaveChangesAsync();

        // --- Step 4: Revoke old token and link to new one (audit trail) ---
        existingToken.RevokedAt = DateTime.UtcNow;
        existingToken.ReplacedByToken = newTokenEntity.Id.ToString();
        existingToken.UpdatedAt = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync();

        // --- Step 5: Build response (pre-onboarding: tokens + user only; post-onboarding: + org + stations + subscription) ---
        if (!user.OrganizationId.HasValue)
            return Result<AuthResponse>.Success(BuildAuthResponse(user, userRole, newPlainToken));

        var organization = await _organizationRepo.GetByIdWithStationsAsync(user.OrganizationId.Value, cancellationToken);
        if (organization == null)
            return Result<AuthResponse>.Failure("Organization not found.");

        var stations = await GetStationsForUserAsync(user.Id, organization.Id, cancellationToken, organization);
        var subscription = await _subscriptionRepo.GetActiveSubscriptionForUserAsync(user.Id, cancellationToken);
        return Result<AuthResponse>.Success(BuildAuthResponse(user, userRole, newPlainToken, organization, stations, subscription));
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
    /// Builds the auth response DTO: tokens, user info, and optionally org/stations/subscription (null when pre-onboarding).
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
