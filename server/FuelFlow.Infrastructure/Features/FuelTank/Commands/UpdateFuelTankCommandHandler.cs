using MediatR;
using Microsoft.Extensions.Logging;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.FuelTank;
using FuelFlow.Application.Features.FuelTank.Commands;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Application.Interfaces.Services;

namespace FuelFlow.Infrastructure.Features.FuelTank.Commands;

public class UpdateFuelTankCommandHandler : IRequestHandler<UpdateFuelTankCommand, Result<FuelTankDto>>
{
    private readonly ICurrentUserService _currentUser;
    private readonly IStationRepository _stationRepo;
    private readonly IFuelTypeRepository _fuelTypeRepo;
    private readonly IFuelTankRepository _fuelTankRepo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<UpdateFuelTankCommandHandler> _logger;

    public UpdateFuelTankCommandHandler(
        ICurrentUserService currentUser,
        IStationRepository stationRepo,
        IFuelTypeRepository fuelTypeRepo,
        IFuelTankRepository fuelTankRepo,
        IUnitOfWork unitOfWork,
        ILogger<UpdateFuelTankCommandHandler> logger)
    {
        _currentUser = currentUser;
        _stationRepo = stationRepo;
        _fuelTypeRepo = fuelTypeRepo;
        _fuelTankRepo = fuelTankRepo;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Result<FuelTankDto>> Handle(UpdateFuelTankCommand request, CancellationToken cancellationToken)
    {
        var orgId = _currentUser.OrganizationId;
        if (orgId == null)
            return Result<FuelTankDto>.Failure("You must belong to an organization.");

        var station = await _stationRepo.GetByIdAsync(request.StationId, cancellationToken);
        if (station == null)
            return Result<FuelTankDto>.Failure("Station not found.");
        if (station.OrganizationId != orgId)
            return Result<FuelTankDto>.Failure("You do not have access to this station.");

        var tank = await _fuelTankRepo.GetByIdAsync(request.TankId, cancellationToken);
        if (tank == null)
            return Result<FuelTankDto>.Failure("Fuel tank not found.");
        if (tank.StationId != request.StationId)
            return Result<FuelTankDto>.Failure("Fuel tank does not belong to this station.");

        var fuelType = await _fuelTypeRepo.GetByIdAsync(request.Request.FuelTypeId, cancellationToken);
        if (fuelType == null)
            return Result<FuelTankDto>.Failure("Fuel type not found.");

        if (fuelType.StationId != request.StationId)
            return Result<FuelTankDto>.Failure("Fuel type does not belong to this station.");

        if (!string.IsNullOrWhiteSpace(request.Request.Name))
        {
            var normalizedName = request.Request.Name.Trim().ToLowerInvariant();
            var duplicate = (await _fuelTankRepo.GetAllByStationIdAsync(request.StationId, cancellationToken))
                .FirstOrDefault(t =>
                    t.Id != request.TankId
                    && t.Name != null
                    && t.Name.ToLowerInvariant() == normalizedName);
            if (duplicate != null)
                return Result<FuelTankDto>.Failure("A tank with this name already exists at this station.");
        }

        tank.Name = string.IsNullOrWhiteSpace(request.Request.Name) ? null : request.Request.Name.Trim();
        tank.CapacityLiters = request.Request.CapacityLiters;
        tank.FuelTypeId = request.Request.FuelTypeId;

        try
        {
            await _unitOfWork.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update fuel tank {TankId}", request.TankId);
            return Result<FuelTankDto>.Failure("Failed to update fuel tank.");
        }

        return Result<FuelTankDto>.Success(new FuelTankDto
        {
            Id = tank.Id,
            Name = tank.Name,
            CapacityLiters = tank.CapacityLiters,
            FuelTypeId = tank.FuelTypeId,
            FuelTypeName = fuelType.Name,
        });
    }
}
