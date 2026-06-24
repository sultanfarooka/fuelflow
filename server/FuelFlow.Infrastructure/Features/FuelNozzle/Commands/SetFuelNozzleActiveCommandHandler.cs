using MediatR;
using Microsoft.Extensions.Logging;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.FuelNozzle;
using FuelFlow.Application.Features.FuelNozzle.Commands;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Application.Interfaces.Services;

namespace FuelFlow.Infrastructure.Features.FuelNozzle.Commands;

/// <summary>
/// M08-F03: Toggles a nozzle's IsActive flag. Soft-deactivate is intentionally
/// not blocked by shift assignments — the toggle exists so a "nozzle under
/// maintenance" state is first-class. Hard delete is the protected operation
/// (see DeleteFuelNozzleCommandHandler).
/// </summary>
public class SetFuelNozzleActiveCommandHandler : IRequestHandler<SetFuelNozzleActiveCommand, Result<SetFuelNozzleActiveResponse>>
{
    private readonly ICurrentUserService _currentUser;
    private readonly IStationRepository _stationRepo;
    private readonly IFuelNozzleRepository _fuelNozzleRepo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<SetFuelNozzleActiveCommandHandler> _logger;

    public SetFuelNozzleActiveCommandHandler(
        ICurrentUserService currentUser,
        IStationRepository stationRepo,
        IFuelNozzleRepository fuelNozzleRepo,
        IUnitOfWork unitOfWork,
        ILogger<SetFuelNozzleActiveCommandHandler> logger)
    {
        _currentUser = currentUser;
        _stationRepo = stationRepo;
        _fuelNozzleRepo = fuelNozzleRepo;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Result<SetFuelNozzleActiveResponse>> Handle(SetFuelNozzleActiveCommand request, CancellationToken cancellationToken)
    {
        var orgId = _currentUser.OrganizationId;
        if (orgId == null)
            return Result<SetFuelNozzleActiveResponse>.Failure("You must belong to an organization.");

        var station = await _stationRepo.GetByIdAsync(request.StationId, cancellationToken);
        if (station == null)
            return Result<SetFuelNozzleActiveResponse>.Failure("Station not found.");
        if (station.OrganizationId != orgId)
            return Result<SetFuelNozzleActiveResponse>.Failure("You do not have access to this station.");

        var nozzle = await _fuelNozzleRepo.GetByIdAsync(request.NozzleId, cancellationToken);
        if (nozzle == null)
            return Result<SetFuelNozzleActiveResponse>.Failure("Fuel nozzle not found.");
        if (nozzle.StationId != request.StationId)
            return Result<SetFuelNozzleActiveResponse>.Failure("Fuel nozzle does not belong to this station.");

        if (nozzle.IsActive == request.Request.IsActive)
        {
            // No-op — still return success so the controller can map to 200.
            return Result<SetFuelNozzleActiveResponse>.Success(new SetFuelNozzleActiveResponse
            {
                NozzleId = nozzle.Id,
                IsActive = nozzle.IsActive,
            });
        }

        var oldActive = nozzle.IsActive;
        nozzle.IsActive = request.Request.IsActive;
        _fuelNozzleRepo.Update(nozzle);

        try
        {
            await _unitOfWork.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to set nozzle {NozzleId} active={IsActive}", request.NozzleId, request.Request.IsActive);
            return Result<SetFuelNozzleActiveResponse>.Failure("Failed to update nozzle status.");
        }

        _logger.LogInformation(
            "AUDIT FuelNozzle.SetActive: user {UserId} set nozzle {NozzleId} \"{NozzleNumber}\" at station {StationId} active {OldActive} -> {NewActive}",
            _currentUser.UserId, nozzle.Id, nozzle.NozzleNumber, request.StationId, oldActive, nozzle.IsActive);

        return Result<SetFuelNozzleActiveResponse>.Success(new SetFuelNozzleActiveResponse
        {
            NozzleId = nozzle.Id,
            IsActive = nozzle.IsActive,
        });
    }
}
