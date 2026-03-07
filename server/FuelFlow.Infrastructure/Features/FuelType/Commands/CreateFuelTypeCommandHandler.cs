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
    private readonly ILogger<CreateFuelTypeCommandHandler> _logger;

    public CreateFuelTypeCommandHandler(
        ICurrentUserService currentUser,
        IFuelTypeRepository fuelTypeRepo,
        IStationRepository stationRepo,
        IUnitOfWork unitOfWork,
        ILogger<CreateFuelTypeCommandHandler> logger)
    {
        _currentUser = currentUser;
        _fuelTypeRepo = fuelTypeRepo;
        _stationRepo = stationRepo;
        _unitOfWork = unitOfWork;
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

        // --- Step 3: Create and persist custom fuel type (StationId set) ---
        var fuelType = new FuelTypeEntity
        {
            Name = req.Name.Trim(),
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