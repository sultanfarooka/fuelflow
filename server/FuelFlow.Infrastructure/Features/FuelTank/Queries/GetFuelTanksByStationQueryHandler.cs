using MediatR;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.FuelTank;
using FuelFlow.Application.Features.FuelTank.Queries;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Application.Interfaces.Services;

namespace FuelFlow.Infrastructure.Features.FuelTank.Queries;

/// <summary>
/// Returns all fuel tanks for a station. Validates station belongs to user's org.
/// </summary>
public class GetFuelTanksByStationQueryHandler : IRequestHandler<GetFuelTanksByStationQuery, Result<List<FuelTankDto>>>
{
    private readonly ICurrentUserService _currentUser;
    private readonly IStationRepository _stationRepo;
    private readonly IFuelTankRepository _fuelTankRepo;

    public GetFuelTanksByStationQueryHandler(
        ICurrentUserService currentUser,
        IStationRepository stationRepo,
        IFuelTankRepository fuelTankRepo)
    {
        _currentUser = currentUser;
        _stationRepo = stationRepo;
        _fuelTankRepo = fuelTankRepo;
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
        var dtos = tanks.Select(t => new FuelTankDto
        {
            Id = t.Id,
            Name = t.Name,
            CapacityLiters = t.CapacityLiters,
            FuelTypeId = t.FuelTypeId,
            FuelTypeName = t.FuelType?.Name,
            HasDipChart = t.DipChart != null,
            DipChartEntryCount = t.DipChart?.Entries?.Count ?? 0,
        }).ToList();

        return Result<List<FuelTankDto>>.Success(dtos);
    }
}
