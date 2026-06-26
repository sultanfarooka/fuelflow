using MediatR;
using Microsoft.Extensions.Logging;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.FuelNozzle;
using FuelFlow.Application.Features.FuelNozzle.Commands;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Application.Interfaces.Services;
namespace FuelFlow.Infrastructure.Features.FuelNozzle.Commands;

/// <summary>
/// CQRS Handler: Creates a fuel nozzle for a station.
/// Ensures the current user belongs to the station's organization and that the target tank exists and belongs to the same station.
/// </summary>
public class CreateFuelNozzleCommandHandler : IRequestHandler<CreateFuelNozzleCommand, Result<FuelNozzleDto>>
{
    private readonly ICurrentUserService _currentUser;
    private readonly IStationRepository _stationRepo;
    private readonly IFuelTankRepository _fuelTankRepo;
    private readonly IFuelNozzleRepository _fuelNozzleRepo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<CreateFuelNozzleCommandHandler> _logger;

    public CreateFuelNozzleCommandHandler(
        ICurrentUserService currentUser,
        IStationRepository stationRepo,
        IFuelTankRepository fuelTankRepo,
        IFuelNozzleRepository fuelNozzleRepo,
        IUnitOfWork unitOfWork,
        ILogger<CreateFuelNozzleCommandHandler> logger)
    {
        _currentUser = currentUser;
        _stationRepo = stationRepo;
        _fuelTankRepo = fuelTankRepo;
        _fuelNozzleRepo = fuelNozzleRepo;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    /// <summary>
    /// Validates organization, station, and tank, then creates and persists a new fuel nozzle.
    /// </summary>
    public async Task<Result<FuelNozzleDto>> Handle(CreateFuelNozzleCommand request, CancellationToken cancellationToken)
    {
        // --- Step 1: Require current user to belong to an organization ---
        var orgId = _currentUser.OrganizationId;
        if (orgId == null)
            return Result<FuelNozzleDto>.Failure("You must belong to an organization.");

        // --- Step 2: Load station and ensure it belongs to the user's organization ---
        var station = await _stationRepo.GetByIdAsync(request.StationId, cancellationToken);
        if (station == null)
            return Result<FuelNozzleDto>.Failure("Station not found.");
        if (station.OrganizationId != orgId)
            return Result<FuelNozzleDto>.Failure("You do not have access to this station.");

        // --- Step 3: Load tank and ensure it belongs to the same station ---
        var tank = await _fuelTankRepo.GetByIdAsync(request.Request.TankId, cancellationToken);
        if (tank == null)
            return Result<FuelNozzleDto>.Failure("Fuel tank not found.");
        if (tank.StationId != request.StationId)
            return Result<FuelNozzleDto>.Failure("Tank does not belong to this station.");

        // --- Step 4: Enforce unique nozzle number per tank (case-insensitive) ---
        var existingNozzles = await _fuelNozzleRepo.GetByStationIdAsync(request.StationId, cancellationToken);
        var normalizedNewNozzle = request.Request.NozzleNumber.Trim().ToLowerInvariant();
        if (existingNozzles.Any(n => n.TankId == request.Request.TankId &&
                                     n.NozzleNumber.ToLowerInvariant() == normalizedNewNozzle))
        {
            return Result<FuelNozzleDto>.Failure("A nozzle with this name/number already exists for this tank.");
        }

        // --- Step 5: Create and persist fuel nozzle ---
        var newFuelNozzle = new Domain.Entities.FuelNozzle
        {
            NozzleNumber = request.Request.NozzleNumber.Trim(),
            TankId = request.Request.TankId,
            StationId = request.StationId,
            IsActive = true,
        };
        await _fuelNozzleRepo.AddAsync(newFuelNozzle);
        await _unitOfWork.SaveChangesAsync();

        // M08-F03-R01: audit. Persistent AuditLog table arrives with M01-F08.
        _logger.LogInformation(
            "AUDIT FuelNozzle.Create: user {UserId} created nozzle {NozzleId} \"{NozzleNumber}\" on tank {TankId} \"{TankName}\" at station {StationId}",
            _currentUser.UserId, newFuelNozzle.Id, newFuelNozzle.NozzleNumber, tank.Id, tank.Name ?? "(unnamed)", request.StationId);

        // --- Step 6: Map to DTO and return ---
        return Result<FuelNozzleDto>.Success(new FuelNozzleDto
        {
            Id = newFuelNozzle.Id,
            NozzleNumber = newFuelNozzle.NozzleNumber,
            TankId = newFuelNozzle.TankId,
            TankName = tank.Name,
            StationId = newFuelNozzle.StationId,
            IsActive = newFuelNozzle.IsActive,
        });
    }
}
