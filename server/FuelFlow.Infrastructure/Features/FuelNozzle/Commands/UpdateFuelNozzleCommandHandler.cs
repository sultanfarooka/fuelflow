using MediatR;
using Microsoft.Extensions.Logging;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.FuelNozzle;
using FuelFlow.Application.Features.FuelNozzle.Commands;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Application.Interfaces.Services;

namespace FuelFlow.Infrastructure.Features.FuelNozzle.Commands;

/// <summary>
/// M08-F03: Updates a nozzle's number and/or tank assignment. Re-runs the
/// per-tank-uniqueness check (skipping self) and validates the target tank
/// belongs to the same station. Does NOT change IsActive — that's the
/// SetFuelNozzleActiveCommand path.
/// </summary>
public class UpdateFuelNozzleCommandHandler : IRequestHandler<UpdateFuelNozzleCommand, Result<FuelNozzleDto>>
{
    private readonly ICurrentUserService _currentUser;
    private readonly IStationRepository _stationRepo;
    private readonly IFuelTankRepository _fuelTankRepo;
    private readonly IFuelNozzleRepository _fuelNozzleRepo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<UpdateFuelNozzleCommandHandler> _logger;

    public UpdateFuelNozzleCommandHandler(
        ICurrentUserService currentUser,
        IStationRepository stationRepo,
        IFuelTankRepository fuelTankRepo,
        IFuelNozzleRepository fuelNozzleRepo,
        IUnitOfWork unitOfWork,
        ILogger<UpdateFuelNozzleCommandHandler> logger)
    {
        _currentUser = currentUser;
        _stationRepo = stationRepo;
        _fuelTankRepo = fuelTankRepo;
        _fuelNozzleRepo = fuelNozzleRepo;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Result<FuelNozzleDto>> Handle(UpdateFuelNozzleCommand request, CancellationToken cancellationToken)
    {
        var orgId = _currentUser.OrganizationId;
        if (orgId == null)
            return Result<FuelNozzleDto>.Failure("You must belong to an organization.");

        var station = await _stationRepo.GetByIdAsync(request.StationId, cancellationToken);
        if (station == null)
            return Result<FuelNozzleDto>.Failure("Station not found.");
        if (station.OrganizationId != orgId)
            return Result<FuelNozzleDto>.Failure("You do not have access to this station.");

        var nozzle = await _fuelNozzleRepo.GetByIdAsync(request.NozzleId, cancellationToken);
        if (nozzle == null)
            return Result<FuelNozzleDto>.Failure("Fuel nozzle not found.");
        if (nozzle.StationId != request.StationId)
            return Result<FuelNozzleDto>.Failure("Fuel nozzle does not belong to this station.");

        var tank = await _fuelTankRepo.GetByIdAsync(request.Request.TankId, cancellationToken);
        if (tank == null)
            return Result<FuelNozzleDto>.Failure("Fuel tank not found.");
        if (tank.StationId != request.StationId)
            return Result<FuelNozzleDto>.Failure("Tank does not belong to this station.");

        // Per-tank uniqueness, skipping self — matches CreateFuelNozzleCommandHandler.
        var trimmedNumber = request.Request.NozzleNumber.Trim();
        var normalizedNumber = trimmedNumber.ToLowerInvariant();
        var allForStation = await _fuelNozzleRepo.GetByStationIdAsync(request.StationId, cancellationToken);
        if (allForStation.Any(n =>
                n.Id != request.NozzleId &&
                n.TankId == request.Request.TankId &&
                n.NozzleNumber.ToLowerInvariant() == normalizedNumber))
        {
            return Result<FuelNozzleDto>.Failure("A nozzle with this number already exists for this tank.");
        }

        // Capture before-state for audit.
        var oldNumber = nozzle.NozzleNumber;
        var oldTankId = nozzle.TankId;

        nozzle.NozzleNumber = trimmedNumber;
        nozzle.TankId = request.Request.TankId;
        _fuelNozzleRepo.Update(nozzle);

        try
        {
            await _unitOfWork.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update fuel nozzle {NozzleId}", request.NozzleId);
            return Result<FuelNozzleDto>.Failure("Failed to update fuel nozzle.");
        }

        _logger.LogInformation(
            "AUDIT FuelNozzle.Update: user {UserId} updated nozzle {NozzleId} at station {StationId}: number {OldNumber} -> {NewNumber}, tank {OldTankId} -> {NewTankId}",
            _currentUser.UserId, nozzle.Id, request.StationId,
            oldNumber, nozzle.NozzleNumber,
            oldTankId, nozzle.TankId);

        return Result<FuelNozzleDto>.Success(new FuelNozzleDto
        {
            Id = nozzle.Id,
            NozzleNumber = nozzle.NozzleNumber,
            TankId = nozzle.TankId,
            TankName = tank.Name,
            StationId = nozzle.StationId,
            IsActive = nozzle.IsActive,
        });
    }
}
