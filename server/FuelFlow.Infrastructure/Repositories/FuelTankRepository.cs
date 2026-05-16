using Microsoft.EntityFrameworkCore;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Domain.Entities;
using FuelFlow.Infrastructure.Data;

namespace FuelFlow.Infrastructure.Repositories;

public class FuelTankRepository : IFuelTankRepository
{
    private readonly AppDbContext _dbContext;

    public FuelTankRepository(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<FuelTank>> GetAllByStationIdAsync(Guid stationId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.FuelTanks
            .AsNoTracking()
            .Include(f => f.FuelType)
            .Include(f => f.DipChart)
                .ThenInclude(d => d.Entries)
            .Where(f => f.StationId == stationId)
            .OrderBy(f => f.Name ?? f.CreatedAt.ToString())
            .ToListAsync(cancellationToken);
    }

    public async Task<FuelTank?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.FuelTanks
            .Include(f => f.FuelType)
            .FirstOrDefaultAsync(f => f.Id == id, cancellationToken);
    }

    public async Task AddAsync(FuelTank fuelTank)
    {
        await _dbContext.FuelTanks.AddAsync(fuelTank);
    }

    public Task DeleteAsync(FuelTank fuelTank)
    {
        _dbContext.FuelTanks.Remove(fuelTank);
        return Task.CompletedTask;
    }
}
