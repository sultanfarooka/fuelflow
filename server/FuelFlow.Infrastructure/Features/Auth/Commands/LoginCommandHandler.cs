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
/// CQRS Handler: Authenticates user with email/password.
/// Moved from AuthService.LoginAsync.
/// </summary>
public class LoginCommandHandler : IRequestHandler<LoginCommand, Result<AuthResponse>>
{
    private readonly UserManager<AppUser> _userManager;
    private readonly IOrganizationRepository _organizationRepo;
    private readonly IStationRepository _stationRepo;
    private readonly IRefreshTokenRepository _refreshTokenRepo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly JwtTokenService _jwtTokenService;
    private readonly IRequestContextService _requestContext;

    public LoginCommandHandler(
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
        LoginCommand request,
        CancellationToken cancellationToken)
    {
        var req = request.Request;

        // Step 1: Find user by email
        var user = await _userManager.FindByEmailAsync(req.Email);
        if (user == null || !user.IsActive)
            return Result<AuthResponse>.Failure("Invalid email or password.");

        // Step 2: Verify password
        var passwordValid = await _userManager.CheckPasswordAsync(user, req.Password);
        if (!passwordValid)
            return Result<AuthResponse>.Failure("Invalid email or password.");

        // Step 2b: Require email verification (REG-005)
        if (!user.EmailConfirmed)
            return Result<AuthResponse>.Failure("Please verify your email before logging in. Check your inbox or resend the verification email.");

        // Step 3: Load organization and station
        var organization = await _organizationRepo.GetByIdAsync(user.OrganizationId);
        if (organization == null)
            return Result<AuthResponse>.Failure("Organization not found.");

        var station = await _stationRepo.GetFirstByOrganizationIdAsync(organization.Id);

        // Step 4: Create refresh token and persist
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

        // Step 5: Generate tokens and return
        return Result<AuthResponse>.Success(BuildAuthResponse(user, organization, new[] { station }, plainRefreshToken));
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
