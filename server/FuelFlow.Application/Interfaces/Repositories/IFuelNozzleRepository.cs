using FuelFlow.Domain.Entities;

namespace FuelFlow.Application.Interfaces.Repositories;

/// <summary>
/// Repository for FuelNozzle. Scoped by station.
/// </summary>
public interface IFuelNozzleRepository
{
    Task<List<FuelNozzle>> GetByStationIdAsync(Guid stationId, CancellationToken cancellationToken = default);
    Task<FuelNozzle?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(FuelNozzle fuelNozzle);
    Task DeleteAsync(FuelNozzle fuelNozzle);
    /// <summary>M08-F03: mark tracked entity dirty for the next SaveChanges.</summary>
    void Update(FuelNozzle fuelNozzle);
}
