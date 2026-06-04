using Microsoft.EntityFrameworkCore;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Domain.Entities.StationEntities;
using FuelFlow.Infrastructure.Data;

namespace FuelFlow.Infrastructure.Repositories;

public class StationShiftConfigRepository : IStationShiftConfigRepository
{
    private readonly TenantDbContextAccessor _accessor;

    public StationShiftConfigRepository(TenantDbContextAccessor accessor)
    {
        _accessor = accessor;
    }

    public async Task<StationShiftConfig?> GetByStationIdAsync(Guid stationId, CancellationToken ct = default)
    {
        var ctx = await _accessor.GetContextAsync(ct);
        return await ctx.StationShiftConfigs
            .FirstOrDefaultAsync(c => c.StationId == stationId, ct);
    }

    public async Task AddAsync(StationShiftConfig config)
    {
        var ctx = await _accessor.GetContextAsync();
        await ctx.StationShiftConfigs.AddAsync(config);
    }

    public async Task DeleteByStationIdAsync(Guid stationId, CancellationToken ct = default)
    {
        var ctx = await _accessor.GetContextAsync(ct);
        var existing = await ctx.StationShiftConfigs
            .FirstOrDefaultAsync(c => c.StationId == stationId, ct);
        if (existing != null)
            ctx.StationShiftConfigs.Remove(existing);
    }
}
