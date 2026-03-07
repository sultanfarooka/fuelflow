using Microsoft.EntityFrameworkCore;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Domain.Entities;
using FuelFlow.Infrastructure.Data;

namespace FuelFlow.Infrastructure.Repositories;

public class FuelTypeRepository : IFuelTypeRepository
{
    private readonly AppDbContext _dbContext;

    public FuelTypeRepository(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<FuelType?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.FuelTypes
            .AsNoTracking()
            .FirstOrDefaultAsync(f => f.Id == id, cancellationToken);
    }

    public async Task<List<FuelType>> GetAllForStationAsync(Guid stationId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.FuelTypes
            .AsNoTracking()
            .Where(f => f.StationId == stationId)
            .OrderBy(f => f.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(FuelType fuelType)
    {
        await _dbContext.FuelTypes.AddAsync(fuelType);
    }

    public Task DeleteAsync(FuelType fuelType)
    {
        _dbContext.FuelTypes.Remove(fuelType);
        return Task.CompletedTask;
    }
}
