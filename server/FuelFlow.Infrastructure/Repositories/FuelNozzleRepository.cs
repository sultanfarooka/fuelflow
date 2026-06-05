using Microsoft.EntityFrameworkCore;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Domain.Entities;
using FuelFlow.Infrastructure.Data;

namespace FuelFlow.Infrastructure.Repositories;

public class FuelNozzleRepository : IFuelNozzleRepository
{
    private readonly TenantDbContextAccessor _accessor;

    public FuelNozzleRepository(TenantDbContextAccessor accessor)
    {
        _accessor = accessor;
    }

    public async Task<List<FuelNozzle>> GetByStationIdAsync(Guid stationId, CancellationToken cancellationToken = default)
    {
        var ctx = await _accessor.GetContextAsync(cancellationToken);
        return await ctx.FuelNozzles
            .AsNoTracking()
            .Include(n => n.FuelTank)
            .Where(n => n.StationId == stationId)
            .OrderBy(n => n.NozzleNumber)
            .ToListAsync(cancellationToken);
    }

    public async Task<FuelNozzle?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var ctx = await _accessor.GetContextAsync(cancellationToken);
        return await ctx.FuelNozzles
            .Include(n => n.FuelTank)
            .FirstOrDefaultAsync(n => n.Id == id, cancellationToken);
    }

    public async Task AddAsync(FuelNozzle fuelNozzle)
    {
        var ctx = await _accessor.GetContextAsync();
        await ctx.FuelNozzles.AddAsync(fuelNozzle);
    }

    public Task DeleteAsync(FuelNozzle fuelNozzle)
    {
        _accessor.Context.FuelNozzles.Remove(fuelNozzle);
        return Task.CompletedTask;
    }
}
