using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.FuelNozzle;
using FuelFlow.Application.Features.FuelNozzle.Commands;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Application.Interfaces.Services;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FuelFlow.Infrastructure.Features.FuelNozzle.Commands;

/// <summary>
/// M08-F03: Hard-delete a nozzle. Preflights ShiftAssignment count and
/// returns <see cref="DeleteFuelNozzleResponse.Blocked"/> = true if any
/// exist, so the controller can map to 409 with a precise references list.
/// Mirrors the M08-F02 DeleteFuelTankCommandHandler pattern.
/// </summary>
public class DeleteFuelNozzleCommandHandler : IRequestHandler<DeleteFuelNozzleCommand, Result<DeleteFuelNozzleResponse>>
{
    private readonly ICurrentUserService _currentUser;
    private readonly IStationRepository _stationRepo;
    private readonly IFuelNozzleRepository _fuelNozzleRepo;
    private readonly IShiftAssignmentRepository _shiftAssignmentRepo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<DeleteFuelNozzleCommandHandler> _logger;

    public DeleteFuelNozzleCommandHandler(
        ICurrentUserService currentUser,
        IStationRepository stationRepo,
        IFuelNozzleRepository fuelNozzleRepo,
        IShiftAssignmentRepository shiftAssignmentRepo,
        IUnitOfWork unitOfWork,
        ILogger<DeleteFuelNozzleCommandHandler> logger)
    {
        _currentUser = currentUser;
        _stationRepo = stationRepo;
        _fuelNozzleRepo = fuelNozzleRepo;
        _shiftAssignmentRepo = shiftAssignmentRepo;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Result<DeleteFuelNozzleResponse>> Handle(DeleteFuelNozzleCommand request, CancellationToken cancellationToken)
    {
        var orgId = _currentUser.OrganizationId;
        if (orgId == null)
            return Result<DeleteFuelNozzleResponse>.Failure("You must belong to an organization.");

        var station = await _stationRepo.GetByIdAsync(request.StationId, cancellationToken);
        if (station == null)
            return Result<DeleteFuelNozzleResponse>.Failure("Station not found.");
        if (station.OrganizationId != orgId)
            return Result<DeleteFuelNozzleResponse>.Failure("You do not have access to this station.");

        var nozzle = await _fuelNozzleRepo.GetByIdAsync(request.NozzleId, cancellationToken);
        if (nozzle == null)
            return Result<DeleteFuelNozzleResponse>.Failure("Fuel nozzle not found.");
        if (nozzle.StationId != request.StationId)
            return Result<DeleteFuelNozzleResponse>.Failure("Fuel nozzle does not belong to this station.");

        var assignmentCount = await _shiftAssignmentRepo.CountByNozzleIdAsync(request.NozzleId, cancellationToken);
        if (assignmentCount > 0)
        {
            _logger.LogInformation(
                "AUDIT FuelNozzle.Delete.Blocked: user {UserId} attempted to delete nozzle {NozzleId} \"{NozzleNumber}\" at station {StationId}; blocked by {AssignmentCount} shift assignment(s)",
                _currentUser.UserId, nozzle.Id, nozzle.NozzleNumber, request.StationId, assignmentCount);
            return Result<DeleteFuelNozzleResponse>.Success(new DeleteFuelNozzleResponse
            {
                NozzleId = nozzle.Id,
                Blocked = true,
                BlockingReferences = new List<string>
                {
                    assignmentCount == 1 ? "1 shift assignment" : $"{assignmentCount} shift assignments",
                },
            });
        }

        try
        {
            await _fuelNozzleRepo.DeleteAsync(nozzle);
            await _unitOfWork.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            // Fallback for any FK violations the preflight doesn't cover.
            _logger.LogError(ex, "Failed to delete fuel nozzle {NozzleId} from station {StationId}", request.NozzleId, request.StationId);
            return Result<DeleteFuelNozzleResponse>.Failure("Failed to delete fuel nozzle. It may be referenced by other records.");
        }

        _logger.LogInformation(
            "AUDIT FuelNozzle.Delete: user {UserId} deleted nozzle {NozzleId} \"{NozzleNumber}\" (tank {TankId}) from station {StationId}",
            _currentUser.UserId, nozzle.Id, nozzle.NozzleNumber, nozzle.TankId, request.StationId);

        return Result<DeleteFuelNozzleResponse>.Success(new DeleteFuelNozzleResponse
        {
            NozzleId = nozzle.Id,
            Blocked = false,
        });
    }
}
