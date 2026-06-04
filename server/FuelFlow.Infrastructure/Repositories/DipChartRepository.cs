using Microsoft.EntityFrameworkCore;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Domain.Entities;
using FuelFlow.Infrastructure.Data;

namespace FuelFlow.Infrastructure.Repositories;

public class DipChartRepository : IDipChartRepository
{
    private readonly TenantDbContextAccessor _accessor;

    public DipChartRepository(TenantDbContextAccessor accessor)
    {
        _accessor = accessor;
    }

    public async Task<DipChart?> GetByTankIdAsync(Guid tankId, CancellationToken cancellationToken = default)
    {
        var ctx = await _accessor.GetContextAsync(cancellationToken);
        return await ctx.DipCharts
            .Include(d => d.Entries.OrderBy(e => e.DepthCm))
            .FirstOrDefaultAsync(d => d.TankId == tankId, cancellationToken);
    }

    public async Task AddAsync(DipChart dipChart)
    {
        var ctx = await _accessor.GetContextAsync();
        await ctx.DipCharts.AddAsync(dipChart);
    }

    public async Task DeleteByTankIdAsync(Guid tankId, CancellationToken cancellationToken = default)
    {
        var ctx = await _accessor.GetContextAsync(cancellationToken);
        var existing = await ctx.DipCharts
            .Include(d => d.Entries)
            .FirstOrDefaultAsync(d => d.TankId == tankId, cancellationToken);

        if (existing != null)
        {
            ctx.DipChartEntries.RemoveRange(existing.Entries);
            ctx.DipCharts.Remove(existing);
        }
    }
}
