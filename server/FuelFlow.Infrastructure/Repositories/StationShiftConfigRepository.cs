using Microsoft.EntityFrameworkCore;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Domain.Entities.StationEntities;
using FuelFlow.Infrastructure.Data;

namespace FuelFlow.Infrastructure.Repositories;

public class StationShiftConfigRepository : IStationShiftConfigRepository
{
    private readonly AppDbContext _dbContext;

    public StationShiftConfigRepository(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<StationShiftConfig?> GetByStationIdAsync(Guid stationId, CancellationToken ct = default)
        => await _dbContext.StationShiftConfigs
            .FirstOrDefaultAsync(c => c.StationId == stationId, ct);

    public async Task AddAsync(StationShiftConfig config)
        => await _dbContext.StationShiftConfigs.AddAsync(config);

    public async Task DeleteByStationIdAsync(Guid stationId, CancellationToken ct = default)
    {
        var existing = await _dbContext.StationShiftConfigs
            .FirstOrDefaultAsync(c => c.StationId == stationId, ct);
        if (existing != null)
            _dbContext.StationShiftConfigs.Remove(existing);
    }
}
