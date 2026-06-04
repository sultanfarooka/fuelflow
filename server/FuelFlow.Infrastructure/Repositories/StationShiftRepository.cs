using Microsoft.EntityFrameworkCore;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Domain.Entities;
using FuelFlow.Domain.Enums;
using FuelFlow.Infrastructure.Data;

namespace FuelFlow.Infrastructure.Repositories;

public class StationShiftRepository : IStationShiftRepository
{
    private readonly TenantDbContextAccessor _accessor;

    public StationShiftRepository(TenantDbContextAccessor accessor)
    {
        _accessor = accessor;
    }

    public async Task<List<StationShift>> GetByStationIdAsync(Guid stationId, int limit = 50, CancellationToken cancellationToken = default)
    {
        var ctx = await _accessor.GetContextAsync(cancellationToken);
        return await ctx.StationShifts
            .AsNoTracking()
            .Where(s => s.StationId == stationId)
            .OrderByDescending(s => s.OpenedAt)
            .Take(limit)
            .ToListAsync(cancellationToken);
    }

    public async Task<StationShift?> GetOpenShiftByStationIdAsync(Guid stationId, CancellationToken cancellationToken = default)
    {
        var ctx = await _accessor.GetContextAsync(cancellationToken);
        return await ctx.StationShifts
            .FirstOrDefaultAsync(s => s.StationId == stationId && s.Status == ShiftStatus.Open, cancellationToken);
    }

    public async Task<StationShift?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var ctx = await _accessor.GetContextAsync(cancellationToken);
        return await ctx.StationShifts
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
    }

    public async Task AddAsync(StationShift stationShift)
    {
        var ctx = await _accessor.GetContextAsync();
        await ctx.StationShifts.AddAsync(stationShift);
    }

    public void Update(StationShift stationShift)
    {
        _accessor.Context.StationShifts.Update(stationShift);
    }
}
