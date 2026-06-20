using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.FuelTank;
using FuelFlow.Application.Features.FuelTank.Commands;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Application.Interfaces.Services;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FuelFlow.Infrastructure.Features.FuelTank.Commands;

public class DeleteFuelTankCommandHandler : IRequestHandler<DeleteFuelTankCommand, Result<DeleteFuelTankResponse>>
{
    private readonly ICurrentUserService _currentUser;
    private readonly IStationRepository _stationRepo;
    private readonly IFuelTankRepository _fuelTankRepo;
    private readonly IFuelNozzleRepository _fuelNozzleRepo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<DeleteFuelTankCommandHandler> _logger;

    public DeleteFuelTankCommandHandler(
        ICurrentUserService currentUser,
        IStationRepository stationRepo,
        IFuelTankRepository fuelTankRepo,
        IFuelNozzleRepository fuelNozzleRepo,
        IUnitOfWork unitOfWork,
        ILogger<DeleteFuelTankCommandHandler> logger)
    {
        _currentUser = currentUser;
        _stationRepo = stationRepo;
        _fuelTankRepo = fuelTankRepo;
        _fuelNozzleRepo = fuelNozzleRepo;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Result<DeleteFuelTankResponse>> Handle(DeleteFuelTankCommand request, CancellationToken cancellationToken)
    {
        var orgId = _currentUser.OrganizationId;
        if (orgId == null)
            return Result<DeleteFuelTankResponse>.Failure("You must belong to an organization.");

        var station = await _stationRepo.GetByIdAsync(request.StationId, cancellationToken);
        if (station == null)
            return Result<DeleteFuelTankResponse>.Failure("Station not found.");
        if (station.OrganizationId != orgId)
            return Result<DeleteFuelTankResponse>.Failure("You do not have access to this station.");

        var tank = await _fuelTankRepo.GetByIdAsync(request.TankId, cancellationToken);
        if (tank == null)
            return Result<DeleteFuelTankResponse>.Failure("Fuel tank not found.");
        if (tank.StationId != request.StationId)
            return Result<DeleteFuelTankResponse>.Failure("Fuel tank does not belong to this station.");

        // M08-F02: preflight nozzle count so the controller can map to 409 with
        // a human-readable references list rather than relying on the EF cascade
        // exception's opaque message. Mirrors the M08-F08 deactivate guard.
        var nozzles = await _fuelNozzleRepo.GetByStationIdAsync(request.StationId, cancellationToken);
        var nozzlesOnTank = nozzles.Count(n => n.TankId == request.TankId);
        if (nozzlesOnTank > 0)
        {
            _logger.LogInformation(
                "AUDIT FuelTank.Delete.Blocked: user {UserId} attempted to delete tank {TankId} at station {StationId}; blocked by {NozzleCount} nozzle(s)",
                _currentUser.UserId, request.TankId, request.StationId, nozzlesOnTank);
            return Result<DeleteFuelTankResponse>.Success(new DeleteFuelTankResponse
            {
                TankId = request.TankId,
                Blocked = true,
                BlockingReferences = new List<string>
                {
                    nozzlesOnTank == 1 ? "1 nozzle" : $"{nozzlesOnTank} nozzles",
                },
            });
        }

        try
        {
            await _fuelTankRepo.DeleteAsync(tank);
            await _unitOfWork.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            // Fallback path: catches FK-cascade violations from records the
            // preflight doesn't cover yet (e.g. FuelTankReadings — no dedicated
            // repo on this branch; tracked as a future tightening).
            _logger.LogError(ex, "Failed to delete fuel tank {TankId} from station {StationId}", request.TankId, request.StationId);
            return Result<DeleteFuelTankResponse>.Failure("Failed to delete fuel tank. It may be referenced by other records.");
        }

        _logger.LogInformation(
            "AUDIT FuelTank.Delete: user {UserId} deleted tank {TankId} \"{Name}\" (capacity {Capacity} L, fuelType {FuelTypeId}) from station {StationId}",
            _currentUser.UserId, tank.Id, tank.Name ?? "(unnamed)", tank.CapacityLiters, tank.FuelTypeId, request.StationId);

        return Result<DeleteFuelTankResponse>.Success(new DeleteFuelTankResponse
        {
            TankId = request.TankId,
            Blocked = false,
        });
    }
}
