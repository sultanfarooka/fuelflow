using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.FuelType;
using FuelFlow.Application.Features.FuelType.Command;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Application.Interfaces.Services;
using MediatR;
using Microsoft.Extensions.Logging;
using FuelTypeEntity = FuelFlow.Domain.Entities.FuelType;

namespace FuelFlow.Infrastructure.Features.FuelType.Commands;

/// <summary>
/// Creates a custom fuel type for a station (FuelType with StationId set). Validates that the station
/// belongs to the current user's organization. Only FuelTypes from this command can be used as FuelTypeId for tanks/prices.
/// </summary>
public class CreateFuelTypeCommandHandler : IRequestHandler<CreateFuelTypeCommand, Result<CreateFuelTypeResponse>>
{
    private readonly ICurrentUserService _currentUser;
    private readonly IFuelTypeRepository _fuelTypeRepo;
    private readonly IStationRepository _stationRepo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAccountHeadSeeder _accountHeadSeeder;
    private readonly ILogger<CreateFuelTypeCommandHandler> _logger;

    public CreateFuelTypeCommandHandler(
        ICurrentUserService currentUser,
        IFuelTypeRepository fuelTypeRepo,
        IStationRepository stationRepo,
        IUnitOfWork unitOfWork,
        IAccountHeadSeeder accountHeadSeeder,
        ILogger<CreateFuelTypeCommandHandler> logger)
    {
        _currentUser = currentUser;
        _fuelTypeRepo = fuelTypeRepo;
        _stationRepo = stationRepo;
        _unitOfWork = unitOfWork;
        _accountHeadSeeder = accountHeadSeeder;
        _logger = logger;
    }

    /// <summary>
    /// Validates station exists and belongs to user's org, then creates a FuelType with StationId set (custom type).
    /// </summary>
    public async Task<Result<CreateFuelTypeResponse>> Handle(CreateFuelTypeCommand request, CancellationToken cancellationToken)
    {
        var req = request.Request;
        var stationId = request.StationId;

        // --- Step 1: Require current user to belong to an organization ---
        var orgId = _currentUser.OrganizationId;
        if (orgId == null)
            return Result<CreateFuelTypeResponse>.Failure("You must belong to an organization to create a fuel type.");

        // --- Step 2: Load station and ensure it belongs to user's organization ---
        var station = await _stationRepo.GetByIdAsync(stationId, cancellationToken);
        if (station == null)
            return Result<CreateFuelTypeResponse>.Failure("Station not found.");

        if (station.OrganizationId != orgId)
            return Result<CreateFuelTypeResponse>.Failure("You do not have access to this station.");

        // --- Step 3: Reject duplicate names per station (case-insensitive, trimmed) [M08-F08-R02] ---
        var name = req.Name.Trim();
        var existing = await _fuelTypeRepo.GetAllForStationAsync(stationId, cancellationToken);
        if (existing.Any(f => string.Equals(f.Name, name, StringComparison.OrdinalIgnoreCase)))
            return Result<CreateFuelTypeResponse>.Failure($"A fuel type named \"{name}\" already exists for this station.");

        // --- Step 4: Create and persist custom fuel type (StationId set) ---
        var fuelType = new FuelTypeEntity
        {
            Name = name,
            Unit = string.IsNullOrWhiteSpace(req.Unit) ? "L" : req.Unit.Trim(),
            StationId = stationId,
            IsCustom = req.IsCustom,
            OMCId = req.OmcId ?? null,
        };
        try
        {
            await _fuelTypeRepo.AddAsync(fuelType);
            await _unitOfWork.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create fuel type {Name} for station {StationId}", req.Name, stationId);
            return Result<CreateFuelTypeResponse>.Failure("Failed to create fuel type.");
        }

        // Audit (M08-F08-R07): record the sensitive action with actor + station.
        _logger.LogInformation(
            "AUDIT FuelType.Create: user {UserId} created fuel type {FuelTypeId} \"{Name}\" (unit {Unit}, custom {IsCustom}) for station {StationId}",
            _currentUser.UserId, fuelType.Id, fuelType.Name, fuelType.Unit, fuelType.IsCustom, stationId);

        // Seed the matching income account heads for this fuel type (M05-F09-R02):
        // "Fuel Sales {name} (Cash/Card)" and "Credit Sales {name}". Idempotent and
        // best-effort — a seeding failure must not fail fuel-type creation.
        try
        {
            await _accountHeadSeeder.SeedFuelTypeIncomeHeadsAsync(orgId.Value, fuelType.Name, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to seed income account heads for fuel type {Name} in org {OrgId}", fuelType.Name, orgId);
        }

        return Result<CreateFuelTypeResponse>.Success(new CreateFuelTypeResponse()
        {
            Id = fuelType.Id,
            Name = fuelType.Name,
            Unit = fuelType.Unit,
            IsCustom = fuelType.IsCustom,
            OMCId = fuelType.OMCId,
        });
    }
}