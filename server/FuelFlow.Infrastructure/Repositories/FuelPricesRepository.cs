using Microsoft.EntityFrameworkCore;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Domain.Entities;
using FuelFlow.Infrastructure.Data;

namespace FuelFlow.Infrastructure.Repositories;

public class FuelPricesRepository : IFuelPricesRepository
{
    private readonly TenantDbContextAccessor _accessor;

    public FuelPricesRepository(TenantDbContextAccessor accessor)
    {
        _accessor = accessor;
    }

    public async Task<List<FuelPrices>> GetByStationIdAsync(Guid stationId, CancellationToken cancellationToken = default)
    {
        var ctx = await _accessor.GetContextAsync(cancellationToken);
        return await ctx.FuelPrices
            .AsNoTracking()
            .Include(p => p.FuelType)
            .Where(p => p.StationId == stationId)
            .OrderByDescending(p => p.EffectiveFrom)
            .ToListAsync(cancellationToken);
    }

    public async Task<FuelPrices?> GetCurrentByStationAndFuelTypeAsync(Guid stationId, Guid fuelTypeId, CancellationToken cancellationToken = default)
    {
        var ctx = await _accessor.GetContextAsync(cancellationToken);
        var now = DateTime.UtcNow;
        return await ctx.FuelPrices
            .Where(p => p.StationId == stationId && p.FuelTypeId == fuelTypeId
                && p.EffectiveFrom <= now && (p.EffectiveTo == null || p.EffectiveTo > now))
            .OrderByDescending(p => p.EffectiveFrom)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<FuelPrices?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var ctx = await _accessor.GetContextAsync(cancellationToken);
        return await ctx.FuelPrices
            .Include(p => p.FuelType)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
    }

    public async Task AddAsync(FuelPrices fuelPrices)
    {
        var ctx = await _accessor.GetContextAsync();
        await ctx.FuelPrices.AddAsync(fuelPrices);
    }

    public void Update(FuelPrices fuelPrices)
    {
        _accessor.Context.FuelPrices.Update(fuelPrices);
    }
}
