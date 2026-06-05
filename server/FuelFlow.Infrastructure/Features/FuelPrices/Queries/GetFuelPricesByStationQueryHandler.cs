using MediatR;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.FuelPrices;
using FuelFlow.Application.Features.FuelPrices.Queries;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Application.Interfaces.Services;

namespace FuelFlow.Infrastructure.Features.FuelPrices.Queries;

public class GetFuelPricesByStationQueryHandler : IRequestHandler<GetFuelPricesByStationQuery, Result<List<FuelPricesDto>>>
{
    private readonly ICurrentUserService _currentUser;
    private readonly IStationRepository _stationRepo;
    private readonly IFuelPricesRepository _fuelPricesRepo;
    private readonly IFuelTypeRepository _fuelTypeRepo;

    public GetFuelPricesByStationQueryHandler(
        ICurrentUserService currentUser,
        IStationRepository stationRepo,
        IFuelPricesRepository fuelPricesRepo,
        IFuelTypeRepository fuelTypeRepo)
    {
        _currentUser = currentUser;
        _stationRepo = stationRepo;
        _fuelPricesRepo = fuelPricesRepo;
        _fuelTypeRepo = fuelTypeRepo;
    }

    public async Task<Result<List<FuelPricesDto>>> Handle(GetFuelPricesByStationQuery request, CancellationToken cancellationToken)
    {
        var orgId = _currentUser.OrganizationId;
        if (orgId == null)
            return Result<List<FuelPricesDto>>.Failure("You must belong to an organization.");

        var station = await _stationRepo.GetByIdAsync(request.StationId, cancellationToken);
        if (station == null)
            return Result<List<FuelPricesDto>>.Failure("Station not found.");
        if (station.OrganizationId != orgId)
            return Result<List<FuelPricesDto>>.Failure("You do not have access to this station.");

        var list = await _fuelPricesRepo.GetByStationIdAsync(request.StationId, cancellationToken);

        // Batch-load fuel type names via control-plane repo (M14-F02: cross-context nav removed).
        var fuelTypes = await _fuelTypeRepo.GetAllForStationAsync(request.StationId, cancellationToken);
        var fuelTypeMap = fuelTypes.ToDictionary(ft => ft.Id, ft => ft.Name);

        var dtos = list.Select(p => new FuelPricesDto
        {
            Id = p.Id,
            FuelTypeId = p.FuelTypeId,
            FuelTypeName = fuelTypeMap.GetValueOrDefault(p.FuelTypeId),
            StationId = p.StationId,
            Price = p.Price,
            EffectiveFrom = p.EffectiveFrom,
            EffectiveTo = p.EffectiveTo,
        }).ToList();

        return Result<List<FuelPricesDto>>.Success(dtos);
    }
}
