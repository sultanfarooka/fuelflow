using MediatR;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.FuelNozzle;
using FuelFlow.Application.Features.FuelNozzle.Queries;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Application.Interfaces.Services;

namespace FuelFlow.Infrastructure.Features.FuelNozzle.Queries;

public class GetFuelNozzlesByStationQueryHandler : IRequestHandler<GetFuelNozzlesByStationQuery, Result<List<FuelNozzleDto>>>
{
    private readonly ICurrentUserService _currentUser;
    private readonly IStationRepository _stationRepo;
    private readonly IFuelNozzleRepository _fuelNozzleRepo;
    private readonly IShiftAssignmentRepository _shiftAssignmentRepo;

    public GetFuelNozzlesByStationQueryHandler(
        ICurrentUserService currentUser,
        IStationRepository stationRepo,
        IFuelNozzleRepository fuelNozzleRepo,
        IShiftAssignmentRepository shiftAssignmentRepo)
    {
        _currentUser = currentUser;
        _stationRepo = stationRepo;
        _fuelNozzleRepo = fuelNozzleRepo;
        _shiftAssignmentRepo = shiftAssignmentRepo;
    }

    public async Task<Result<List<FuelNozzleDto>>> Handle(GetFuelNozzlesByStationQuery request, CancellationToken cancellationToken)
    {
        var orgId = _currentUser.OrganizationId;
        if (orgId == null)
            return Result<List<FuelNozzleDto>>.Failure("You must belong to an organization.");

        var station = await _stationRepo.GetByIdAsync(request.StationId, cancellationToken);
        if (station == null)
            return Result<List<FuelNozzleDto>>.Failure("Station not found.");
        if (station.OrganizationId != orgId)
            return Result<List<FuelNozzleDto>>.Failure("You do not have access to this station.");

        var list = await _fuelNozzleRepo.GetByStationIdAsync(request.StationId, cancellationToken);

        // M08-F03: batch-count assignments per nozzle (single query) — used by
        // the panel's "Assignments" column + the delete reference-guard.
        var assignmentCounts = await _shiftAssignmentRepo
            .CountByNozzleIdsAsync(list.Select(n => n.Id), cancellationToken);

        var dtos = list.Select(n => new FuelNozzleDto
        {
            Id = n.Id,
            NozzleNumber = n.NozzleNumber,
            TankId = n.TankId,
            TankName = n.FuelTank?.Name,
            StationId = n.StationId,
            IsActive = n.IsActive,
            ShiftAssignmentCount = assignmentCounts.TryGetValue(n.Id, out var c) ? c : 0,
        }).ToList();

        return Result<List<FuelNozzleDto>>.Success(dtos);
    }
}
