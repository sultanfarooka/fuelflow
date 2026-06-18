using FuelFlow.Domain.Entities;

namespace FuelFlow.Application.Interfaces.Repositories;

/// <summary>
/// Read-only lookup for FuelType (validate id exists when creating tanks).
/// GetAvailableForStationAsync returns predefined (StationId null) + station-specific types.
/// </summary>
public interface IFuelTypeRepository
{
    Task<FuelType?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<List<FuelType>> GetAllForStationAsync(Guid stationId, CancellationToken cancellationToken = default);
    Task AddAsync(FuelType fuelType);
    Task UpdateAsync(FuelType fuelType);
    Task DeleteAsync(FuelType fuelType);
}
