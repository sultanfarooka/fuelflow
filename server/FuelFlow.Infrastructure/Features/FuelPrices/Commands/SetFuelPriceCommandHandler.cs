using MediatR;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.FuelPrices;
using FuelFlow.Application.Features.FuelPrices.Commands;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Application.Interfaces.Services;
namespace FuelFlow.Infrastructure.Features.FuelPrices.Commands;

public class SetFuelPriceCommandHandler : IRequestHandler<SetFuelPriceCommand, Result<FuelPricesDto>>
{
    private readonly ICurrentUserService _currentUser;
    private readonly IStationRepository _stationRepo;
    private readonly IFuelTypeRepository _fuelTypeRepo;
    private readonly IFuelPricesRepository _fuelPricesRepo;
    private readonly IUnitOfWork _unitOfWork;

    public SetFuelPriceCommandHandler(
        ICurrentUserService currentUser,
        IStationRepository stationRepo,
        IFuelTypeRepository fuelTypeRepo,
        IFuelPricesRepository fuelPricesRepo,
        IUnitOfWork unitOfWork)
    {
        _currentUser = currentUser;
        _stationRepo = stationRepo;
        _fuelTypeRepo = fuelTypeRepo;
        _fuelPricesRepo = fuelPricesRepo;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<FuelPricesDto>> Handle(SetFuelPriceCommand request, CancellationToken cancellationToken)
    {
        var orgId = _currentUser.OrganizationId;
        if (orgId == null)
            return Result<FuelPricesDto>.Failure("You must belong to an organization.");

        var station = await _stationRepo.GetByIdAsync(request.StationId, cancellationToken);
        if (station == null)
            return Result<FuelPricesDto>.Failure("Station not found.");
        if (station.OrganizationId != orgId)
            return Result<FuelPricesDto>.Failure("You do not have access to this station.");

        var fuelType = await _fuelTypeRepo.GetByIdAsync(request.Request.FuelTypeId, cancellationToken);
        if (fuelType == null)
            return Result<FuelPricesDto>.Failure("Fuel type not found.");

        var current = await _fuelPricesRepo.GetCurrentByStationAndFuelTypeAsync(request.StationId, request.Request.FuelTypeId, cancellationToken);
        if (current != null && current.EffectiveTo == null)
        {
            current.EffectiveTo = request.Request.EffectiveFrom;
            current.UpdatedAt = DateTime.UtcNow;
            _fuelPricesRepo.Update(current);
        }

        var now = DateTime.UtcNow;
        var price = new Domain.Entities.FuelPrices
        {
            FuelTypeId = request.Request.FuelTypeId,
            StationId = request.StationId,
            Price = request.Request.Price,
            EffectiveFrom = request.Request.EffectiveFrom,
            EffectiveTo = null,
            CreatedAt = now,
            UpdatedAt = now,
        };
        await _fuelPricesRepo.AddAsync(price);
        await _unitOfWork.SaveChangesAsync();

        return Result<FuelPricesDto>.Success(new FuelPricesDto
        {
            Id = price.Id,
            FuelTypeId = price.FuelTypeId,
            FuelTypeName = fuelType.Name,
            StationId = price.StationId,
            Price = price.Price,
            EffectiveFrom = price.EffectiveFrom,
            EffectiveTo = price.EffectiveTo,
        });
    }
}
