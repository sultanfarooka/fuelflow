using FuelFlow.Application.Common;
using FuelFlow.Application.Features.FuelType.Command;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Application.Interfaces.Services;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FuelFlow.Infrastructure.Features.FuelType.Commands;

/// <summary>
/// Deletes a fuel type from a station. Validates that the station belongs to
/// the current user's organization and that the fuel type belongs to the station.
/// </summary>
public class DeleteFuelTypeCommandHandler : IRequestHandler<DeleteFuelTypeCommand, Result<bool>>
{
    private readonly ICurrentUserService _currentUser;
    private readonly IFuelTypeRepository _fuelTypeRepo;
    private readonly IStationRepository _stationRepo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<DeleteFuelTypeCommandHandler> _logger;

    public DeleteFuelTypeCommandHandler(
        ICurrentUserService currentUser,
        IFuelTypeRepository fuelTypeRepo,
        IStationRepository stationRepo,
        IUnitOfWork unitOfWork,
        ILogger<DeleteFuelTypeCommandHandler> logger)
    {
        _currentUser = currentUser;
        _fuelTypeRepo = fuelTypeRepo;
        _stationRepo = stationRepo;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Result<bool>> Handle(DeleteFuelTypeCommand request, CancellationToken cancellationToken)
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

        try
        {
            await _fuelTypeRepo.DeleteAsync(fuelType);
            await _unitOfWork.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete fuel type {FuelTypeId} from station {StationId}", request.FuelTypeId, request.StationId);
            return Result<bool>.Failure("Failed to delete fuel type. It may be in use by tanks or prices.");
        }

        return Result<bool>.Success(true);
    }
}
