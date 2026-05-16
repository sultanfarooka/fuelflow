using MediatR;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.DipChart;
using FuelFlow.Application.Features.DipChart.Queries;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Application.Interfaces.Services;

namespace FuelFlow.Infrastructure.Features.DipChart.Queries;

public class GetDipChartByTankQueryHandler
    : IRequestHandler<GetDipChartByTankQuery, Result<DipChartDto?>>
{
    private readonly ICurrentUserService _currentUser;
    private readonly IStationRepository _stationRepo;
    private readonly IFuelTankRepository _fuelTankRepo;
    private readonly IDipChartRepository _dipChartRepo;

    public GetDipChartByTankQueryHandler(
        ICurrentUserService currentUser,
        IStationRepository stationRepo,
        IFuelTankRepository fuelTankRepo,
        IDipChartRepository dipChartRepo)
    {
        _currentUser = currentUser;
        _stationRepo = stationRepo;
        _fuelTankRepo = fuelTankRepo;
        _dipChartRepo = dipChartRepo;
    }

    public async Task<Result<DipChartDto?>> Handle(
        GetDipChartByTankQuery request,
        CancellationToken cancellationToken)
    {
        var orgId = _currentUser.OrganizationId;
        if (orgId == null)
            return Result<DipChartDto?>.Failure("You must belong to an organization.");

        var station = await _stationRepo.GetByIdAsync(request.StationId, cancellationToken);
        if (station == null)
            return Result<DipChartDto?>.Failure("Station not found.");
        if (station.OrganizationId != orgId)
            return Result<DipChartDto?>.Failure("You do not have access to this station.");

        var tank = await _fuelTankRepo.GetByIdAsync(request.TankId, cancellationToken);
        if (tank == null || tank.StationId != request.StationId)
            return Result<DipChartDto?>.Failure("Tank not found in this station.");

        var chart = await _dipChartRepo.GetByTankIdAsync(request.TankId, cancellationToken);
        if (chart == null)
            return Result<DipChartDto?>.Success(null);

        return Result<DipChartDto?>.Success(new DipChartDto
        {
            Id = chart.Id,
            TankId = chart.TankId,
            EntryCount = chart.Entries.Count,
            Entries = chart.Entries.Select(e => new DipChartEntryDto
            {
                Id = e.Id,
                DepthCm = e.DepthCm,
                VolumeLiters = e.VolumeLiters,
            }).ToList(),
        });
    }
}
