using FuelFlow.Domain.Entities;

namespace FuelFlow.Application.Interfaces.Repositories;

/// <summary>
/// Repository for FuelTank entity. Scoped by station.
/// </summary>
public interface IFuelTankRepository
{
    Task<List<FuelTank>> GetAllByStationIdAsync(Guid stationId, CancellationToken cancellationToken = default);
    Task<FuelTank?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(FuelTank fuelTank);
}
