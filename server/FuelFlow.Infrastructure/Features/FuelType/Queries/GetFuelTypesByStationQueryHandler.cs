using MediatR;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.FuelType;
using FuelFlow.Application.Features.FuelType.Queries;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Application.Interfaces.Services;

namespace FuelFlow.Infrastructure.Features.FuelType.Queries;

/// <summary>
/// Returns fuel types available for a station: (1) from the station's OMC (OMCFuelTypes) and (2) custom types (FuelType with StationId set).
/// Validates that the station belongs to the current user's organization.
/// </summary>
public class GetFuelTypesByStationQueryHandler : IRequestHandler<GetFuelTypesByStationQuery, Result<List<FuelTypeDto>>>
{
    private readonly ICurrentUserService _currentUser;
    private readonly IStationRepository _stationRepo;
    private readonly IFuelTypeRepository _fuelTypeRepo;
    private readonly IFuelTankRepository _fuelTankRepo;
    private readonly IFuelPricesRepository _fuelPricesRepo;

    public GetFuelTypesByStationQueryHandler(
        ICurrentUserService currentUser,
        IStationRepository stationRepo,
        IFuelTypeRepository fuelTypeRepo,
        IFuelTankRepository fuelTankRepo,
        IFuelPricesRepository fuelPricesRepo)
    {
        _currentUser = currentUser;
        _stationRepo = stationRepo;
        _fuelTypeRepo = fuelTypeRepo;
        _fuelTankRepo = fuelTankRepo;
        _fuelPricesRepo = fuelPricesRepo;
    }

    /// <summary>
    /// Loads station (with org check), then FuelTypes scoped to that station (including OMC-derived copies and custom types); returns list with Source set.
    /// </summary>
    public async Task<Result<List<FuelTypeDto>>> Handle(
        GetFuelTypesByStationQuery request,
        CancellationToken cancellationToken)
    {
        // --- Step 1: Require current user to belong to an organization ---
        var orgId = _currentUser.OrganizationId;
        if (orgId == null)
            return Result<List<FuelTypeDto>>.Failure("You must belong to an organization to view fuel types.");

        // --- Step 2: Load station and ensure it belongs to user's organization ---
        var station = await _stationRepo.GetByIdAsync(request.StationId, cancellationToken);
        if (station == null)
            return Result<List<FuelTypeDto>>.Failure("Station not found.");
        if (station.OrganizationId != orgId)
            return Result<List<FuelTypeDto>>.Failure("You do not have access to this station.");

        // --- Step 3: Load FuelTypes scoped to this station (OMC-derived + custom) ---
        var fuelTypes = await _fuelTypeRepo.GetAllForStationAsync(request.StationId, cancellationToken);

        // --- Step 4: Load references once to compute per-type tank count + active-price flag (M08-F08-R01/R06) ---
        var tanks = await _fuelTankRepo.GetAllByStationIdAsync(request.StationId, cancellationToken);
        var tankCountByFuelType = tanks
            .GroupBy(t => t.FuelTypeId)
            .ToDictionary(g => g.Key, g => g.Count());

        var now = DateTime.UtcNow;
        var prices = await _fuelPricesRepo.GetByStationIdAsync(request.StationId, cancellationToken);
        var fuelTypesWithActivePrice = prices
            .Where(p => p.EffectiveFrom <= now && (p.EffectiveTo == null || p.EffectiveTo > now))
            .Select(p => p.FuelTypeId)
            .ToHashSet();

        // --- Step 5: Map to DTOs with Source, status, and reference info ---
        return Result<List<FuelTypeDto>>.Success(fuelTypes.Select(t => new FuelTypeDto()
        {
            Id = t.Id,
            Name = t.Name,
            Unit = t.Unit,
            IsCustom = t.IsCustom,
            OMCId = t.OMCId,
            Source = t.IsCustom ? "Custom" : "OMC",
            IsActive = t.IsActive,
            TankCount = tankCountByFuelType.TryGetValue(t.Id, out var count) ? count : 0,
            HasActivePrice = fuelTypesWithActivePrice.Contains(t.Id),
        }).ToList());
    }
}
