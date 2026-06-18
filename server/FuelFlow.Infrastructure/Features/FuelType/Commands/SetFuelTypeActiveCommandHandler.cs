using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.FuelType;
using FuelFlow.Application.Features.FuelType.Command;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Application.Interfaces.Services;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FuelFlow.Infrastructure.Features.FuelType.Commands;

/// <summary>
/// [M08-F08-R04/R05] Activates or deactivates a fuel type for a station.
/// Activation is always allowed. Deactivation is blocked while the type is
/// referenced by a tank or a currently-effective price — in that case the
/// response carries Blocked=true plus human-readable reasons (the controller
/// maps that to HTTP 409). Audit-logged.
/// </summary>
public class SetFuelTypeActiveCommandHandler : IRequestHandler<SetFuelTypeActiveCommand, Result<SetFuelTypeActiveResponse>>
{
    private readonly ICurrentUserService _currentUser;
    private readonly IFuelTypeRepository _fuelTypeRepo;
    private readonly IStationRepository _stationRepo;
    private readonly IFuelTankRepository _fuelTankRepo;
    private readonly IFuelPricesRepository _fuelPricesRepo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<SetFuelTypeActiveCommandHandler> _logger;

    public SetFuelTypeActiveCommandHandler(
        ICurrentUserService currentUser,
        IFuelTypeRepository fuelTypeRepo,
        IStationRepository stationRepo,
        IFuelTankRepository fuelTankRepo,
        IFuelPricesRepository fuelPricesRepo,
        IUnitOfWork unitOfWork,
        ILogger<SetFuelTypeActiveCommandHandler> logger)
    {
        _currentUser = currentUser;
        _fuelTypeRepo = fuelTypeRepo;
        _stationRepo = stationRepo;
        _fuelTankRepo = fuelTankRepo;
        _fuelPricesRepo = fuelPricesRepo;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Result<SetFuelTypeActiveResponse>> Handle(SetFuelTypeActiveCommand request, CancellationToken cancellationToken)
    {
        var orgId = _currentUser.OrganizationId;
        if (orgId == null)
            return Result<SetFuelTypeActiveResponse>.Failure("You must belong to an organization.");

        var station = await _stationRepo.GetByIdAsync(request.StationId, cancellationToken);
        if (station == null)
            return Result<SetFuelTypeActiveResponse>.Failure("Station not found.");
        if (station.OrganizationId != orgId)
            return Result<SetFuelTypeActiveResponse>.Failure("You do not have access to this station.");

        var fuelType = await _fuelTypeRepo.GetByIdAsync(request.FuelTypeId, cancellationToken);
        if (fuelType == null)
            return Result<SetFuelTypeActiveResponse>.Failure("Fuel type not found.");
        if (fuelType.StationId != request.StationId)
            return Result<SetFuelTypeActiveResponse>.Failure("Fuel type does not belong to this station.");

        var targetActive = request.Request.IsActive;

        // No-op if already in the requested state.
        if (fuelType.IsActive == targetActive)
            return Result<SetFuelTypeActiveResponse>.Success(new SetFuelTypeActiveResponse
            {
                FuelTypeId = fuelType.Id,
                IsActive = fuelType.IsActive,
            });

        // Deactivation guard (M08-F08-R05): block while referenced by a tank or an active price.
        if (!targetActive)
        {
            var references = new List<string>();

            var tanks = await _fuelTankRepo.GetAllByStationIdAsync(request.StationId, cancellationToken);
            var tankCount = tanks.Count(t => t.FuelTypeId == fuelType.Id);
            if (tankCount > 0)
                references.Add(tankCount == 1 ? "1 tank" : $"{tankCount} tanks");

            var now = DateTime.UtcNow;
            var prices = await _fuelPricesRepo.GetByStationIdAsync(request.StationId, cancellationToken);
            var hasActivePrice = prices.Any(p => p.FuelTypeId == fuelType.Id
                && p.EffectiveFrom <= now && (p.EffectiveTo == null || p.EffectiveTo > now));
            if (hasActivePrice)
                references.Add("an active price");

            if (references.Count > 0)
            {
                _logger.LogInformation(
                    "AUDIT FuelType.Deactivate BLOCKED: user {UserId} attempted to deactivate fuel type {FuelTypeId} for station {StationId}; blocked by {References}",
                    _currentUser.UserId, fuelType.Id, request.StationId, string.Join(", ", references));

                return Result<SetFuelTypeActiveResponse>.Success(new SetFuelTypeActiveResponse
                {
                    FuelTypeId = fuelType.Id,
                    IsActive = true,
                    Blocked = true,
                    BlockingReferences = references,
                });
            }
        }

        fuelType.IsActive = targetActive;
        try
        {
            await _fuelTypeRepo.UpdateAsync(fuelType);
            await _unitOfWork.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to set active={Active} on fuel type {FuelTypeId} for station {StationId}", targetActive, request.FuelTypeId, request.StationId);
            return Result<SetFuelTypeActiveResponse>.Failure("Failed to update fuel type status.");
        }

        // Audit (M08-F08-R07).
        _logger.LogInformation(
            "AUDIT FuelType.{Action}: user {UserId} set fuel type {FuelTypeId} active={Active} for station {StationId}",
            targetActive ? "Activate" : "Deactivate", _currentUser.UserId, fuelType.Id, targetActive, request.StationId);

        return Result<SetFuelTypeActiveResponse>.Success(new SetFuelTypeActiveResponse
        {
            FuelTypeId = fuelType.Id,
            IsActive = fuelType.IsActive,
        });
    }
}
