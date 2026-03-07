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

    public GetFuelNozzlesByStationQueryHandler(
        ICurrentUserService currentUser,
        IStationRepository stationRepo,
        IFuelNozzleRepository fuelNozzleRepo)
    {
        _currentUser = currentUser;
        _stationRepo = stationRepo;
        _fuelNozzleRepo = fuelNozzleRepo;
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
        var dtos = list.Select(n => new FuelNozzleDto
        {
            Id = n.Id,
            NozzleNumber = n.NozzleNumber,
            TankId = n.TankId,
            TankName = n.FuelTank?.Name,
            StationId = n.StationId,
            IsActive = n.IsActive,
        }).ToList();

        return Result<List<FuelNozzleDto>>.Success(dtos);
    }
}
