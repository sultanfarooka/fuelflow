using Microsoft.EntityFrameworkCore;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Domain.Entities;
using FuelFlow.Infrastructure.Data;

namespace FuelFlow.Infrastructure.Repositories;

public class FuelPricesRepository : IFuelPricesRepository
{
    private readonly AppDbContext _dbContext;

    public FuelPricesRepository(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<FuelPrices>> GetByStationIdAsync(Guid stationId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.FuelPrices
            .AsNoTracking()
            .Include(p => p.FuelType)
            .Where(p => p.StationId == stationId)
            .OrderByDescending(p => p.EffectiveFrom)
            .ToListAsync(cancellationToken);
    }

    public async Task<FuelPrices?> GetCurrentByStationAndFuelTypeAsync(Guid stationId, Guid fuelTypeId, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        return await _dbContext.FuelPrices
            .Where(p => p.StationId == stationId && p.FuelTypeId == fuelTypeId
                && p.EffectiveFrom <= now && (p.EffectiveTo == null || p.EffectiveTo > now))
            .OrderByDescending(p => p.EffectiveFrom)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<FuelPrices?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.FuelPrices
            .Include(p => p.FuelType)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
    }

    public async Task AddAsync(FuelPrices fuelPrices)
    {
        await _dbContext.FuelPrices.AddAsync(fuelPrices);
    }

    public void Update(FuelPrices fuelPrices)
    {
        _dbContext.FuelPrices.Update(fuelPrices);
    }
}
