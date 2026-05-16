using Microsoft.EntityFrameworkCore;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Domain.Entities;
using FuelFlow.Infrastructure.Data;

namespace FuelFlow.Infrastructure.Repositories;

public class DipChartRepository : IDipChartRepository
{
    private readonly AppDbContext _dbContext;

    public DipChartRepository(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<DipChart?> GetByTankIdAsync(Guid tankId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.DipCharts
            .Include(d => d.Entries.OrderBy(e => e.DepthCm))
            .FirstOrDefaultAsync(d => d.TankId == tankId, cancellationToken);
    }

    public async Task AddAsync(DipChart dipChart)
    {
        await _dbContext.DipCharts.AddAsync(dipChart);
    }

    public async Task DeleteByTankIdAsync(Guid tankId, CancellationToken cancellationToken = default)
    {
        var existing = await _dbContext.DipCharts
            .Include(d => d.Entries)
            .FirstOrDefaultAsync(d => d.TankId == tankId, cancellationToken);

        if (existing != null)
        {
            _dbContext.DipChartEntries.RemoveRange(existing.Entries);
            _dbContext.DipCharts.Remove(existing);
        }
    }
}
