using FuelFlow.Domain.Entities;

namespace FuelFlow.Application.Interfaces.Repositories;

/// <summary>
/// Repository for StationShift. Scoped by station.
/// </summary>
public interface IStationShiftRepository
{
    Task<List<StationShift>> GetByStationIdAsync(Guid stationId, int limit = 50, CancellationToken cancellationToken = default);
    Task<StationShift?> GetOpenShiftByStationIdAsync(Guid stationId, CancellationToken cancellationToken = default);
    Task<StationShift?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(StationShift stationShift);
    void Update(StationShift stationShift);
}
