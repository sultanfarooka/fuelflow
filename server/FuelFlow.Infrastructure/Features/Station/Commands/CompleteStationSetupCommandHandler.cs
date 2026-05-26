using MediatR;
using Microsoft.Extensions.Logging;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.Station;
using FuelFlow.Application.Features.Station.Commands;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Application.Interfaces.Services;
using FuelFlow.Domain.Entities;
using FuelFlow.Domain.Entities.StationEntities;

namespace FuelFlow.Infrastructure.Features.Station.Commands;

public class CompleteStationSetupCommandHandler : IRequestHandler<CompleteStationSetupCommand, Result<CompleteSetupResult>>
{
    private readonly ICurrentUserService _currentUser;
    private readonly IStationRepository _stationRepo;
    private readonly IStationShiftConfigRepository _shiftConfigRepo;
    private readonly IFuelTypeRepository _fuelTypeRepo;
    private readonly IFuelPricesRepository _fuelPricesRepo;
    private readonly IFuelTankRepository _fuelTankRepo;
    private readonly IDipChartRepository _dipChartRepo;
    private readonly IFuelNozzleRepository _nozzleRepo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<CompleteStationSetupCommandHandler> _logger;

    public CompleteStationSetupCommandHandler(
        ICurrentUserService currentUser,
        IStationRepository stationRepo,
        IStationShiftConfigRepository shiftConfigRepo,
        IFuelTypeRepository fuelTypeRepo,
        IFuelPricesRepository fuelPricesRepo,
        IFuelTankRepository fuelTankRepo,
        IDipChartRepository dipChartRepo,
        IFuelNozzleRepository nozzleRepo,
        IUnitOfWork unitOfWork,
        ILogger<CompleteStationSetupCommandHandler> logger)
    {
        _currentUser = currentUser;
        _stationRepo = stationRepo;
        _shiftConfigRepo = shiftConfigRepo;
        _fuelTypeRepo = fuelTypeRepo;
        _fuelPricesRepo = fuelPricesRepo;
        _fuelTankRepo = fuelTankRepo;
        _dipChartRepo = dipChartRepo;
        _nozzleRepo = nozzleRepo;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Result<CompleteSetupResult>> Handle(CompleteStationSetupCommand request, CancellationToken ct)
    {
        var orgId = _currentUser.OrganizationId;
        if (orgId == null)
            return Result<CompleteSetupResult>.Failure("You must belong to an organization.");

        var station = await _stationRepo.GetByIdAsync(request.StationId, ct);
        if (station == null || station.OrganizationId != orgId)
            return Result<CompleteSetupResult>.Failure("Station not found or access denied.");

        // Load independent data in parallel
        var shiftConfigTask = _shiftConfigRepo.GetByStationIdAsync(request.StationId, ct);
        var fuelTypesTask = _fuelTypeRepo.GetAllForStationAsync(request.StationId, ct);
        var pricesTask = _fuelPricesRepo.GetByStationIdAsync(request.StationId, ct);
        var tanksTask = _fuelTankRepo.GetAllByStationIdAsync(request.StationId, ct);
        var nozzlesTask = _nozzleRepo.GetByStationIdAsync(request.StationId, ct);

        await Task.WhenAll(shiftConfigTask, fuelTypesTask, pricesTask, tanksTask, nozzlesTask);

        var shiftConfig = await shiftConfigTask;
        var fuelTypes = await fuelTypesTask;
        var prices = await pricesTask;
        var tanks = await tanksTask;
        var nozzles = await nozzlesTask;

        var unmet = new List<string>();

        // 1. Shift config
        if (shiftConfig == null)
            unmet.Add("Shift schedule has not been configured.");

        // 2. At least one fuel type
        if (fuelTypes.Count == 0)
        {
            unmet.Add("No fuel types have been added.");
        }
        else
        {
            // 3. Every fuel type has a price
            var pricedTypeIds = prices.Select(p => p.FuelTypeId).ToHashSet();
            foreach (var ft in fuelTypes)
            {
                if (!pricedTypeIds.Contains(ft.Id))
                    unmet.Add($"No opening price set for \"{ft.Name}\".");
            }

            // 4. Every fuel type has at least one tank
            var coveredTypeIds = tanks.Select(t => t.FuelTypeId).ToHashSet();
            foreach (var ft in fuelTypes)
            {
                if (!coveredTypeIds.Contains(ft.Id))
                    unmet.Add($"No tank added for \"{ft.Name}\".");
            }

            // 5. Every tank has a dip chart with at least one entry — checked sequentially (by tank id)
            foreach (var tank in tanks)
            {
                var chart = await _dipChartRepo.GetByTankIdAsync(tank.Id, ct);
                if (chart == null || !chart.Entries.Any())
                    unmet.Add($"Tank \"{tank.Name ?? tank.Id.ToString()[..8]}\" has no dip chart entries.");
            }
        }

        // 6. At least one nozzle
        if (nozzles.Count == 0)
            unmet.Add("No nozzles have been added.");

        if (unmet.Count > 0)
            return Result<CompleteSetupResult>.Success(new CompleteSetupResult { Success = false, UnmetConditions = unmet });

        station.IsSetupComplete = true;
        station.UpdatedAt = DateTime.UtcNow;

        try
        {
            await _unitOfWork.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to mark station {StationId} setup complete", request.StationId);
            return Result<CompleteSetupResult>.Failure("Failed to complete setup.");
        }

        return Result<CompleteSetupResult>.Success(new CompleteSetupResult { Success = true });
    }
}
