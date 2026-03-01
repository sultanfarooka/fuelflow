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
/// CQRS Handler: Authenticates user with email/password. Issues refresh token and returns AuthResponse (tokens, UserInfo, Stations, Subscription).
/// </summary>
public class LoginCommandHandler : IRequestHandler<LoginCommand, Result<AuthResponse>>
{
    // Dependencies: Identity, org/station/subscription/refresh repos, JWT, request context (IP, user agent for token)
    private readonly UserManager<AppUser> _userManager;
    private readonly IOrganizationRepository _organizationRepo;
    private readonly IStationRepository _stationRepo;
    private readonly IUserStationRepository _userStationRepo;
    private readonly ISubscriptionRepository _subscriptionRepo;
    private readonly IRefreshTokenRepository _refreshTokenRepo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly JwtTokenService _jwtTokenService;
    private readonly IRequestContextService _requestContext;

    public LoginCommandHandler(
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

    public async Task<Result<AuthResponse>> Handle(
        LoginCommand request,
        CancellationToken cancellationToken)
    {
        var req = request.Request;

        // 1. Find user and validate password; reject if inactive or email not confirmed
        var user = await _userManager.FindByEmailAsync(req.Email);
        if (user == null || !user.IsActive)
            return Result<AuthResponse>.Failure("Invalid email or password.");

        var passwordValid = await _userManager.CheckPasswordAsync(user, req.Password);
        if (!passwordValid)
            return Result<AuthResponse>.Failure("Invalid email or password.");

        if (!user.EmailConfirmed)
            return Result<AuthResponse>.Failure("Please verify your email before logging in. Check your inbox or resend the verification email.");

        // 2. Create and persist new refresh token (rotation: one-time use per token)
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

        // 3. Build response: without org (pre-onboarding) or with org + stations + subscription
        if (!user.OrganizationId.HasValue)
        {
            return Result<AuthResponse>.Success(await BuildAuthResponseWithoutOrgAsync(user, plainRefreshToken, cancellationToken));
        }

        var organization = await _organizationRepo.GetByIdAsync(user.OrganizationId.Value);
        if (organization == null)
            return Result<AuthResponse>.Failure("Organization not found.");

        var stations = await GetStationsForUserAsync(user.Id, organization.Id, cancellationToken);
        var subscription = await _subscriptionRepo.GetActiveSubscriptionForUserAsync(user.Id, cancellationToken);

        return Result<AuthResponse>.Success(BuildAuthResponse(user, organization, stations, subscription, plainRefreshToken));
    }

    /// <summary>Builds auth response for user without organization; stations empty, optional subscription.</summary>
    private async Task<AuthResponse> BuildAuthResponseWithoutOrgAsync(AppUser user, string refreshToken, CancellationToken cancellationToken)
    {
        var subscription = await _subscriptionRepo.GetActiveSubscriptionForUserAsync(user.Id, cancellationToken);
        return new AuthResponse
        {
            AccessToken = _jwtTokenService.GenerateAccessToken(user),
            RefreshToken = refreshToken,
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

    /// <summary>Builds full auth response with tokens, user info, station list, and subscription.</summary>
    private AuthResponse BuildAuthResponse(
        AppUser user,
        Organization org,
        List<StationEntity> stations,
        SubscriptionInfo? subscription,
        string refreshToken)
    {
        return new AuthResponse
        {
            AccessToken = _jwtTokenService.GenerateAccessToken(user),
            RefreshToken = refreshToken,
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
