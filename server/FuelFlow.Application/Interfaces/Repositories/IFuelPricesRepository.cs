using FuelFlow.Domain.Entities;

namespace FuelFlow.Application.Interfaces.Repositories;

/// <summary>
/// Repository for FuelPrices (price history per fuel type per station).
/// </summary>
public interface IFuelPricesRepository
{
    Task<List<FuelPrices>> GetByStationIdAsync(Guid stationId, CancellationToken cancellationToken = default);
    Task<FuelPrices?> GetCurrentByStationAndFuelTypeAsync(Guid stationId, Guid fuelTypeId, CancellationToken cancellationToken = default);
    Task<FuelPrices?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(FuelPrices fuelPrices);
    void Update(FuelPrices fuelPrices);
}
