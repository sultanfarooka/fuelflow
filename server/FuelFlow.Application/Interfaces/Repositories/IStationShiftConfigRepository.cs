using FuelFlow.Domain.Entities.StationEntities;

namespace FuelFlow.Application.Interfaces.Repositories;

public interface IStationShiftConfigRepository
{
    Task<StationShiftConfig?> GetByStationIdAsync(Guid stationId, CancellationToken ct = default);
    Task AddAsync(StationShiftConfig config);
    Task DeleteByStationIdAsync(Guid stationId, CancellationToken ct = default);
}
