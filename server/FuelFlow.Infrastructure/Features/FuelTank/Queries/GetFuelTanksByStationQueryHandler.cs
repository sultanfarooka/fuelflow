using MediatR;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.FuelTank;
using FuelFlow.Application.Features.FuelTank.Queries;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Application.Interfaces.Services;

namespace FuelFlow.Infrastructure.Features.FuelTank.Queries;

public class GetFuelTanksByStationQueryHandler : IRequestHandler<GetFuelTanksByStationQuery, Result<List<FuelTankDto>>>
{
    private readonly ICurrentUserService _currentUser;
    private readonly IStationRepository _stationRepo;
    private readonly IFuelTankRepository _fuelTankRepo;
    private readonly IFuelTypeRepository _fuelTypeRepo;
    private readonly IFuelNozzleRepository _fuelNozzleRepo;

    public GetFuelTanksByStationQueryHandler(
        ICurrentUserService currentUser,
        IStationRepository stationRepo,
        IFuelTankRepository fuelTankRepo,
        IFuelTypeRepository fuelTypeRepo,
        IFuelNozzleRepository fuelNozzleRepo)
    {
        _currentUser = currentUser;
        _stationRepo = stationRepo;
        _fuelTankRepo = fuelTankRepo;
        _fuelTypeRepo = fuelTypeRepo;
        _fuelNozzleRepo = fuelNozzleRepo;
    }

    public async Task<Result<List<FuelTankDto>>> Handle(
        GetFuelTanksByStationQuery request,
        CancellationToken cancellationToken)
    {
        var orgId = _currentUser.OrganizationId;
        if (orgId == null)
            return Result<List<FuelTankDto>>.Failure("You must belong to an organization to view fuel tanks.");

        var station = await _stationRepo.GetByIdAsync(request.StationId, cancellationToken);
        if (station == null)
            return Result<List<FuelTankDto>>.Failure("Station not found.");

        if (station.OrganizationId != orgId)
            return Result<List<FuelTankDto>>.Failure("You do not have access to this station.");

        var tanks = await _fuelTankRepo.GetAllByStationIdAsync(request.StationId, cancellationToken);

        // Batch-load fuel type names via control-plane repo (M14-F02: cross-context nav removed).
        var fuelTypes = await _fuelTypeRepo.GetAllForStationAsync(request.StationId, cancellationToken);
        var fuelTypeMap = fuelTypes.ToDictionary(ft => ft.Id, ft => ft.Name);

        // M08-F02: load all nozzles for the station once, count per tank in-memory.
        // Same single-pass shape as M08-F08's per-fuel-type tank count.
        var nozzles = await _fuelNozzleRepo.GetByStationIdAsync(request.StationId, cancellationToken);
        var nozzleCountByTank = nozzles
            .GroupBy(n => n.TankId)
            .ToDictionary(g => g.Key, g => g.Count());

        var dtos = tanks.Select(t => new FuelTankDto
        {
            Id = t.Id,
            Name = t.Name,
            CapacityLiters = t.CapacityLiters,
            FuelTypeId = t.FuelTypeId,
            FuelTypeName = fuelTypeMap.GetValueOrDefault(t.FuelTypeId),
            HasDipChart = t.DipChart != null,
            DipChartEntryCount = t.DipChart?.Entries?.Count ?? 0,
            NozzleCount = nozzleCountByTank.TryGetValue(t.Id, out var count) ? count : 0,
        }).ToList();

        return Result<List<FuelTankDto>>.Success(dtos);
    }
}
