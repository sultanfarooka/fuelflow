using MediatR;
using Microsoft.Extensions.Logging;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.Station;
using FuelFlow.Application.Features.Station.Commands;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Application.Interfaces.Services;
using FuelFlow.Domain.Entities;
using StationEntity = FuelFlow.Domain.Entities.Station;
using FuelTypeEntity = FuelFlow.Domain.Entities.FuelType;

namespace FuelFlow.Infrastructure.Features.Station.Commands;

/// <summary>
/// CQRS Handler: Creates a station for the current user's organization.
/// Enforces subscription plan limit (max_stations); -1 = unlimited. Owner only.
/// Validates that the requested OMC exists before creating the station.
/// </summary>
public class CreateStationCommandHandler : IRequestHandler<CreateStationCommand, Result<CreateStationResponse>>
{
    private readonly ICurrentUserService _currentUser;
    private readonly IStationRepository _stationRepo;
    private readonly ISubscriptionRepository _subscriptionRepo;
    private readonly IOMCRepository _omcRepo;
    private readonly IOMCFuelTypeRepository _omcFuelTypeRepo;
    private readonly IFuelTypeRepository _fuelTypeRepo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<CreateStationCommandHandler> _logger;

    public CreateStationCommandHandler(
        ICurrentUserService currentUser, IOMCFuelTypeRepository omcFuelTypeRepo,
        IFuelTypeRepository fuelTypeRepo,
        IStationRepository stationRepo,
        ISubscriptionRepository subscriptionRepo,
        IOMCRepository omcRepo,
        IUnitOfWork unitOfWork,
        ILogger<CreateStationCommandHandler> logger)
    {
        _currentUser = currentUser;
        _stationRepo = stationRepo;
        _subscriptionRepo = subscriptionRepo;
        _omcRepo = omcRepo;
        _omcFuelTypeRepo = omcFuelTypeRepo;
        _fuelTypeRepo = fuelTypeRepo;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    /// <summary>
    /// Validates user/org/role, plan limit, and OMC; then creates and persists the station.
    /// </summary>
    public async Task<Result<CreateStationResponse>> Handle(
        CreateStationCommand request,
        CancellationToken cancellationToken)
    {
        var req = request.Request;

        // --- Step 1: Require authenticated user with organization ---
        var userId = _currentUser.UserId;
        if (userId == null)
            return Result<CreateStationResponse>.Failure("You must be logged in to create a station.");

        var organizationId = _currentUser.OrganizationId;
        if (organizationId == null)
            return Result<CreateStationResponse>.Failure("You must belong to an organization to create a station.");

        // --- Step 2: Require Owner role ---
        if (string.Equals(_currentUser.Role, "owner", StringComparison.OrdinalIgnoreCase) == false)
            return Result<CreateStationResponse>.Failure("Only the organization owner can create stations.");

        // --- Step 3: Validate OMC exists ---
        var omc = await _omcRepo.GetByIdAsync(req.OMCId, cancellationToken);
        if (omc == null)
            return Result<CreateStationResponse>.Failure("OMC not found.");

        // --- Step 4: Enforce plan limit (max_stations; -1 = unlimited) ---
        var planLimitError = await CheckPlanStationLimitAsync(userId.Value, organizationId.Value, cancellationToken);
        if (planLimitError != null)
            return Result<CreateStationResponse>.Failure(planLimitError);

        // --- Step 5: Create and persist station ---
        var station = new StationEntity
        {
            Name = req.Name.Trim(),
            OMCId = req.OMCId,
            Address = string.IsNullOrWhiteSpace(req.Address) ? null : req.Address.Trim(),
            Phone = string.IsNullOrWhiteSpace(req.Phone) ? null : req.Phone.Trim(),
            LogoUrl = string.IsNullOrWhiteSpace(req.LogoUrl) ? null : req.LogoUrl.Trim(),
            IsActive = true,
            OrganizationId = organizationId.Value,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        try
        {
            await _stationRepo.AddAsync(station);
            await _unitOfWork.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to persist station for org {OrganizationId}", organizationId);
            return Result<CreateStationResponse>.Failure("Failed to add station to the database.");
        }


        return Result<CreateStationResponse>.Success(new CreateStationResponse
        {
            Id = station.Id,
            Name = station.Name,
        });
    }

    /// <summary>Returns an error message if the org is at or over the plan's station limit; null if allowed.</summary>
    private async Task<string?> CheckPlanStationLimitAsync(Guid userId, Guid organizationId, CancellationToken cancellationToken)
    {
        // 1. Get active subscription with plan
        var subscription = await _subscriptionRepo.GetActiveSubscriptionWithPlanForUserAsync(userId, cancellationToken);
        if (subscription == null)
            return null;

        // 2. Check max stations
        var maxStations = subscription.Plan.MaxStations;
        if (maxStations < 0)
            return null; // unlimited

        // 3. Check current station count 
        var currentCount = await _stationRepo.CountByOrganizationIdAsync(organizationId, cancellationToken);
        if (currentCount >= maxStations)
            return $"Station limit reached for your plan ({maxStations} station(s)). Upgrade to add more stations.";

        // 4. Return null if allowed
        return null;
    }
}
