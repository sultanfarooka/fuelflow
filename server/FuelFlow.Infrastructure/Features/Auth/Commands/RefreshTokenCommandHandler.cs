using MediatR;
using Microsoft.AspNetCore.Identity;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.Auth;
using FuelFlow.Application.Features.Auth.Commands;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Application.Interfaces.Services;
using FuelFlow.Domain.Entities;
using FuelFlow.Infrastructure.Identity;
using FuelFlow.Infrastructure.Services;

namespace FuelFlow.Infrastructure.Features.Auth.Commands;

/// <summary>
/// CQRS Handler: Exchanges a valid refresh token for new access + refresh tokens.
/// Implements rotation — the old token is revoked and replaced with a new one.
/// </summary>
public class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, Result<AuthResponse>>
{
    private readonly UserManager<AppUser> _userManager;
    private readonly IOrganizationRepository _organizationRepo;
    private readonly IStationRepository _stationRepo;
    private readonly IRefreshTokenRepository _refreshTokenRepo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly JwtTokenService _jwtTokenService;
    private readonly IRequestContextService _requestContext;

    public RefreshTokenCommandHandler(
        UserManager<AppUser> userManager,
        IOrganizationRepository organizationRepo,
        IStationRepository stationRepo,
        IRefreshTokenRepository refreshTokenRepo,
        IUnitOfWork unitOfWork,
        JwtTokenService jwtTokenService,
        IRequestContextService requestContext)
    {
        _userManager = userManager;
        _organizationRepo = organizationRepo;
        _stationRepo = stationRepo;
        _refreshTokenRepo = refreshTokenRepo;
        _unitOfWork = unitOfWork;
        _jwtTokenService = jwtTokenService;
        _requestContext = requestContext;
    }

    public async Task<Result<AuthResponse>> Handle(
        RefreshTokenCommand request,
        CancellationToken cancellationToken)
    {
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

        var user = await _userManager.FindByIdAsync(existingToken.UserId.ToString());
        if (user == null || !user.IsActive)
            return Result<AuthResponse>.Failure("User not found or inactive.");

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

        // Revoke old token and link to replacement
        existingToken.RevokedAt = DateTime.UtcNow;
        existingToken.ReplacedByToken = newTokenEntity.Id.ToString();
        existingToken.UpdatedAt = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync();

        // Step 5: Return new tokens
        if (!user.OrganizationId.HasValue)
        {
            return Result<AuthResponse>.Success(BuildAuthResponseWithoutOrg(user, newPlainToken));
        }

        var organization = await _organizationRepo.GetByIdAsync(user.OrganizationId.Value);
        if (organization == null)
            return Result<AuthResponse>.Failure("Organization not found.");

        var stations = await _stationRepo.GetByOrganizationIdAsync(organization.Id);
        return Result<AuthResponse>.Success(BuildAuthResponse(user, organization, stations.ToArray(), newPlainToken));
    }

    private AuthResponse BuildAuthResponseWithoutOrg(AppUser user, string refreshToken)
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
                Stations = new List<StationInfo>(),
            },
            Subscription = null,
        };
    }

    private AuthResponse BuildAuthResponse(
        AppUser user,
        Organization org,
        Station?[] stations,
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
                Stations = stations
                    .Where(s => s != null)
                    .Select(s => new StationInfo { Id = s!.Id, Name = s.Name })
                    .ToList(),
            },
            Subscription = new SubscriptionInfo
            {
                Status = org.SubscriptionStatus.ToString().ToLower(),
                Plan = "professional",
                TrialEndsAt = org.TrialEndsAt,
            },
        };
    }
}
