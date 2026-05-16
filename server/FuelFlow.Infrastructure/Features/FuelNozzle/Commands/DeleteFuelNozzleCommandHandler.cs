using FuelFlow.Application.Common;
using FuelFlow.Application.Features.FuelNozzle.Commands;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Application.Interfaces.Services;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FuelFlow.Infrastructure.Features.FuelNozzle.Commands;

public class DeleteFuelNozzleCommandHandler : IRequestHandler<DeleteFuelNozzleCommand, Result<bool>>
{
    private readonly ICurrentUserService _currentUser;
    private readonly IStationRepository _stationRepo;
    private readonly IFuelNozzleRepository _fuelNozzleRepo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<DeleteFuelNozzleCommandHandler> _logger;

    public DeleteFuelNozzleCommandHandler(
        ICurrentUserService currentUser,
        IStationRepository stationRepo,
        IFuelNozzleRepository fuelNozzleRepo,
        IUnitOfWork unitOfWork,
        ILogger<DeleteFuelNozzleCommandHandler> logger)
    {
        _currentUser = currentUser;
        _stationRepo = stationRepo;
        _fuelNozzleRepo = fuelNozzleRepo;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Result<bool>> Handle(DeleteFuelNozzleCommand request, CancellationToken cancellationToken)
    {
        var orgId = _currentUser.OrganizationId;
        if (orgId == null)
            return Result<bool>.Failure("You must belong to an organization.");

        var station = await _stationRepo.GetByIdAsync(request.StationId, cancellationToken);
        if (station == null)
            return Result<bool>.Failure("Station not found.");
        if (station.OrganizationId != orgId)
            return Result<bool>.Failure("You do not have access to this station.");

        var nozzle = await _fuelNozzleRepo.GetByIdAsync(request.NozzleId, cancellationToken);
        if (nozzle == null)
            return Result<bool>.Failure("Fuel nozzle not found.");
        if (nozzle.StationId != request.StationId)
            return Result<bool>.Failure("Fuel nozzle does not belong to this station.");

        try
        {
            await _fuelNozzleRepo.DeleteAsync(nozzle);
            await _unitOfWork.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete fuel nozzle {NozzleId} from station {StationId}", request.NozzleId, request.StationId);
            return Result<bool>.Failure("Failed to delete fuel nozzle. It may be in use by shift assignments.");
        }

        return Result<bool>.Success(true);
    }
}

