using Microsoft.EntityFrameworkCore;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Domain.Entities;
using FuelFlow.Infrastructure.Data;

namespace FuelFlow.Infrastructure.Repositories;

public class FuelTankRepository : IFuelTankRepository
{
    private readonly TenantDbContextAccessor _accessor;

    public FuelTankRepository(TenantDbContextAccessor accessor)
    {
        _accessor = accessor;
    }

    public async Task<List<FuelTank>> GetAllByStationIdAsync(Guid stationId, CancellationToken cancellationToken = default)
    {
        var ctx = await _accessor.GetContextAsync(cancellationToken);
        return await ctx.FuelTanks
            .AsNoTracking()
            .Where(f => f.StationId == stationId)
            .OrderBy(f => f.Name ?? f.CreatedAt.ToString())
            .ToListAsync(cancellationToken);
    }

    public async Task<FuelTank?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var ctx = await _accessor.GetContextAsync(cancellationToken);
        return await ctx.FuelTanks
            .FirstOrDefaultAsync(f => f.Id == id, cancellationToken);
    }

    public async Task AddAsync(FuelTank fuelTank)
    {
        var ctx = await _accessor.GetContextAsync();
        await ctx.FuelTanks.AddAsync(fuelTank);
    }

    public Task DeleteAsync(FuelTank fuelTank)
    {
        _accessor.Context.FuelTanks.Remove(fuelTank);
        return Task.CompletedTask;
    }
}
