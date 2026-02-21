using MediatR;
using Microsoft.AspNetCore.Identity;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.Auth;
using FuelFlow.Application.Features.Auth.Queries;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Domain.Entities;
using FuelFlow.Infrastructure.Identity;
using FuelFlow.Infrastructure.Services;

namespace FuelFlow.Infrastructure.Features.Auth.Queries;

/// <summary>
/// CQRS Handler: Returns the current authenticated user's profile.
/// Moved from AuthService.GetCurrentUserAsync.
/// </summary>
public class GetCurrentUserQueryHandler : IRequestHandler<GetCurrentUserQuery, Result<AuthResponse>>
{
    private readonly UserManager<AppUser> _userManager;
    private readonly IOrganizationRepository _organizationRepo;
    private readonly IStationRepository _stationRepo;
    private readonly JwtTokenService _jwtTokenService;

    public GetCurrentUserQueryHandler(
        UserManager<AppUser> userManager,
        IOrganizationRepository organizationRepo,
        IStationRepository stationRepo,
        JwtTokenService jwtTokenService)
    {
        _userManager = userManager;
        _organizationRepo = organizationRepo;
        _stationRepo = stationRepo;
        _jwtTokenService = jwtTokenService;
    }

    public async Task<Result<AuthResponse>> Handle(
        GetCurrentUserQuery request,
        CancellationToken cancellationToken)
    {
        var user = await _userManager.FindByIdAsync(request.UserId.ToString());
        if (user == null || !user.IsActive)
            return Result<AuthResponse>.Failure("User not found.");

        if (!user.OrganizationId.HasValue)
        {
            return Result<AuthResponse>.Success(BuildAuthResponseWithoutOrg(user));
        }

        var organization = await _organizationRepo.GetByIdAsync(user.OrganizationId.Value);
        if (organization == null)
            return Result<AuthResponse>.Failure("Organization not found.");

        var stations = await _stationRepo.GetByOrganizationIdAsync(organization.Id);

        return Result<AuthResponse>.Success(
            BuildAuthResponse(user, organization, stations.ToArray()));
    }

    private AuthResponse BuildAuthResponseWithoutOrg(AppUser user)
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
                Stations = new List<StationInfo>(),
            },
            Subscription = null,
        };
    }

    private AuthResponse BuildAuthResponse(
        AppUser user,
        Organization org,
        params Station?[] stations)
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
