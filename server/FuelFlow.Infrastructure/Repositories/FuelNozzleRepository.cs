using Microsoft.EntityFrameworkCore;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Domain.Entities;
using FuelFlow.Infrastructure.Data;

namespace FuelFlow.Infrastructure.Repositories;

public class FuelNozzleRepository : IFuelNozzleRepository
{
    private readonly AppDbContext _dbContext;

    public FuelNozzleRepository(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<FuelNozzle>> GetByStationIdAsync(Guid stationId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.FuelNozzles
            .AsNoTracking()
            .Include(n => n.FuelTank)
            .Where(n => n.StationId == stationId)
            .OrderBy(n => n.NozzleNumber)
            .ToListAsync(cancellationToken);
    }

    public async Task<FuelNozzle?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.FuelNozzles
            .Include(n => n.FuelTank)
            .FirstOrDefaultAsync(n => n.Id == id, cancellationToken);
    }

    public async Task AddAsync(FuelNozzle fuelNozzle)
    {
        await _dbContext.FuelNozzles.AddAsync(fuelNozzle);
    }

    public Task DeleteAsync(FuelNozzle fuelNozzle)
    {
        _dbContext.FuelNozzles.Remove(fuelNozzle);
        return Task.CompletedTask;
    }
}
