using FuelFlow.Application.Common;
using FuelFlow.Application.Features.FuelTank.Commands;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Application.Interfaces.Services;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FuelFlow.Infrastructure.Features.FuelTank.Commands;

public class DeleteFuelTankCommandHandler : IRequestHandler<DeleteFuelTankCommand, Result<bool>>
{
    private readonly ICurrentUserService _currentUser;
    private readonly IStationRepository _stationRepo;
    private readonly IFuelTankRepository _fuelTankRepo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<DeleteFuelTankCommandHandler> _logger;

    public DeleteFuelTankCommandHandler(
        ICurrentUserService currentUser,
        IStationRepository stationRepo,
        IFuelTankRepository fuelTankRepo,
        IUnitOfWork unitOfWork,
        ILogger<DeleteFuelTankCommandHandler> logger)
    {
        _currentUser = currentUser;
        _stationRepo = stationRepo;
        _fuelTankRepo = fuelTankRepo;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Result<bool>> Handle(DeleteFuelTankCommand request, CancellationToken cancellationToken)
    {
        var orgId = _currentUser.OrganizationId;
        if (orgId == null)
            return Result<bool>.Failure("You must belong to an organization.");

        var station = await _stationRepo.GetByIdAsync(request.StationId, cancellationToken);
        if (station == null)
            return Result<bool>.Failure("Station not found.");
        if (station.OrganizationId != orgId)
            return Result<bool>.Failure("You do not have access to this station.");

        var tank = await _fuelTankRepo.GetByIdAsync(request.TankId, cancellationToken);
        if (tank == null)
            return Result<bool>.Failure("Fuel tank not found.");
        if (tank.StationId != request.StationId)
            return Result<bool>.Failure("Fuel tank does not belong to this station.");

        try
        {
            await _fuelTankRepo.DeleteAsync(tank);
            await _unitOfWork.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete fuel tank {TankId} from station {StationId}", request.TankId, request.StationId);
            return Result<bool>.Failure("Failed to delete fuel tank. It may be referenced by nozzles or other records.");
        }

        return Result<bool>.Success(true);
    }
}
