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
using Microsoft.Extensions.Logging;
using FuelFlow.Infrastructure.Identity;
using FuelFlow.Infrastructure.Services;

namespace FuelFlow.Infrastructure.Features.Onboarding.Commands;

/// <summary>
/// Handles onboarding for a user with no organization: creates the organization, links it to the user,
/// creates the first station, optionally assigns trial subscription, issues a new JWT (with org_id) and refresh token, and returns AuthResponse.
/// Controller sets cookies so the client receives the updated token.
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
        _logger = logger;
    }

    public async Task<Result<AuthResponse>> Handle(OnboardingCommand request, CancellationToken cancellationToken)
    {
        var req = request.Request;

        var userId = _currentUser.UserId!.Value;
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
            return Result<AuthResponse>.Failure("User not found.");

        // Idempotency: reject if user already has an organization
        if (user.OrganizationId.HasValue)
            return Result<AuthResponse>.Failure("Already onboarded.");

        var plainRefreshToken = _jwtTokenService.GenerateRefreshToken();
        Organization newOrganization;
        try
        {
            await _unitOfWork.BeginTransactionAsync();

            newOrganization = new Organization
            {
                Name = req.OrganizationName.Trim(),
                OwnerId = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            await _organizationRepository.AddAsync(newOrganization);
            await _unitOfWork.SaveChangesAsync();

            // Set user.OrganizationId and persist via Identity
            user.OrganizationId = newOrganization.Id;
            await _userManager.UpdateAsync(user);

            // Trial subscription only if user has no active/trial subscription
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

            var station = new StationEntity
            {
                Name = req.StationName.Trim(),
                Address = string.IsNullOrWhiteSpace(req.Address) ? null : req.Address.Trim(),
                Phone = string.IsNullOrWhiteSpace(req.Phone) ? null : req.Phone.Trim(),
                LogoUrl = string.IsNullOrWhiteSpace(req.LogoUrl) ? null : req.LogoUrl.Trim(),
                IsActive = true,
                OrganizationId = newOrganization.Id,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };
            await _stationRepo.AddAsync(station);

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
        }
        catch (Exception ex)
        {
            await _unitOfWork.RollbackAsync();
            _logger.LogError(ex, "Failed to complete onboarding for user {UserId}", userId);
            return Result<AuthResponse>.Failure("Failed to complete onboarding.");
        }

        var authResponse = await BuildAuthResponse(user, newOrganization.Id, plainRefreshToken, cancellationToken);
        return Result<AuthResponse>.Success(authResponse);
    }

    /// <summary>Builds auth response with new access token (includes org_id), user, stations, and subscription.</summary>
    private async Task<AuthResponse> BuildAuthResponse(
        AppUser user,
        Guid organizationId,
        string refreshToken,
        CancellationToken cancellationToken)
    {
        var stations = await _stationRepo.GetByOrganizationIdAsync(organizationId);
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
                Stations = stations.Select(s => new StationInfo { Id = s.Id, Name = s.Name }).ToList(),
            },
            Subscription = subscription,
        };
    }
}
