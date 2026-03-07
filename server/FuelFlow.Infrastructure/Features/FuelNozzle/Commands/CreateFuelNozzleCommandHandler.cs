using MediatR;
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

    public CreateFuelNozzleCommandHandler(
        ICurrentUserService currentUser,
        IStationRepository stationRepo,
        IFuelTankRepository fuelTankRepo,
        IFuelNozzleRepository fuelNozzleRepo,
        IUnitOfWork unitOfWork)
    {
        _currentUser = currentUser;
        _stationRepo = stationRepo;
        _fuelTankRepo = fuelTankRepo;
        _fuelNozzleRepo = fuelNozzleRepo;
        _unitOfWork = unitOfWork;
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

        // --- Step 4: Create and persist fuel nozzle ---
        var newFuelNozzle = new Domain.Entities.FuelNozzle
        {
            NozzleNumber = request.Request.NozzleNumber.Trim(),
            TankId = request.Request.TankId,
            StationId = request.StationId,
            IsActive = true,
        };
        await _fuelNozzleRepo.AddAsync(newFuelNozzle);
        await _unitOfWork.SaveChangesAsync();

        // --- Step 5: Map to DTO and return ---
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
