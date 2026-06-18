using FuelFlow.Application.Common;
using FuelFlow.Application.Features.FuelType.Command;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Application.Interfaces.Services;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FuelFlow.Infrastructure.Features.FuelType.Commands;

/// <summary>
/// [M08-F08-R03] Renames a fuel type's display name for a station. Validates the
/// station belongs to the caller's org and the fuel type belongs to the station,
/// rejects per-station duplicate names (case-insensitive), then persists. Applies
/// to OMC-derived and custom rows alike (both are per-station). Audit-logged.
/// </summary>
public class RenameFuelTypeCommandHandler : IRequestHandler<RenameFuelTypeCommand, Result<bool>>
{
    private readonly ICurrentUserService _currentUser;
    private readonly IFuelTypeRepository _fuelTypeRepo;
    private readonly IStationRepository _stationRepo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<RenameFuelTypeCommandHandler> _logger;

    public RenameFuelTypeCommandHandler(
        ICurrentUserService currentUser,
        IFuelTypeRepository fuelTypeRepo,
        IStationRepository stationRepo,
        IUnitOfWork unitOfWork,
        ILogger<RenameFuelTypeCommandHandler> logger)
    {
        _currentUser = currentUser;
        _fuelTypeRepo = fuelTypeRepo;
        _stationRepo = stationRepo;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Result<bool>> Handle(RenameFuelTypeCommand request, CancellationToken cancellationToken)
    {
        var orgId = _currentUser.OrganizationId;
        if (orgId == null)
            return Result<bool>.Failure("You must belong to an organization.");

        var station = await _stationRepo.GetByIdAsync(request.StationId, cancellationToken);
        if (station == null)
            return Result<bool>.Failure("Station not found.");
        if (station.OrganizationId != orgId)
            return Result<bool>.Failure("You do not have access to this station.");

        var fuelType = await _fuelTypeRepo.GetByIdAsync(request.FuelTypeId, cancellationToken);
        if (fuelType == null)
            return Result<bool>.Failure("Fuel type not found.");
        if (fuelType.StationId != request.StationId)
            return Result<bool>.Failure("Fuel type does not belong to this station.");

        var newName = request.Request.Name.Trim();

        // Reject per-station duplicate names (case-insensitive), ignoring this row.
        var existing = await _fuelTypeRepo.GetAllForStationAsync(request.StationId, cancellationToken);
        if (existing.Any(f => f.Id != fuelType.Id
                && string.Equals(f.Name, newName, StringComparison.OrdinalIgnoreCase)))
            return Result<bool>.Failure($"A fuel type named \"{newName}\" already exists for this station.");

        var oldName = fuelType.Name;
        if (string.Equals(oldName, newName, StringComparison.Ordinal))
            return Result<bool>.Success(true); // no-op

        fuelType.Name = newName;
        try
        {
            await _fuelTypeRepo.UpdateAsync(fuelType);
            await _unitOfWork.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to rename fuel type {FuelTypeId} for station {StationId}", request.FuelTypeId, request.StationId);
            return Result<bool>.Failure("Failed to rename fuel type.");
        }

        // Audit (M08-F08-R07).
        _logger.LogInformation(
            "AUDIT FuelType.Rename: user {UserId} renamed fuel type {FuelTypeId} from \"{OldName}\" to \"{NewName}\" for station {StationId}",
            _currentUser.UserId, fuelType.Id, oldName, newName, request.StationId);

        return Result<bool>.Success(true);
    }
}
