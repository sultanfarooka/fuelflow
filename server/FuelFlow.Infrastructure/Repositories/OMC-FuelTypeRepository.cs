using Microsoft.EntityFrameworkCore;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Infrastructure.Data;

public class OMCFuelTypeRepository : IOMCFuelTypeRepository
{
    private readonly AppDbContext _dbContext;

    public OMCFuelTypeRepository(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<OMCFuelTypes>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.OMCFuelTypes
            .Include(ft => ft.OMC)
            .OrderBy(ft => ft.OMC!.Name)
            .ThenBy(ft => ft.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<OMCFuelTypes>> GetByOMCIdAsync(Guid omcId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.OMCFuelTypes
            .Include(ft => ft.OMC)
            .Where(ft => ft.OMCId == omcId)
            .OrderBy(ft => ft.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<OMCFuelTypes?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.OMCFuelTypes.FindAsync(id);
    }

    public async Task AddAsync(OMCFuelTypes omcFuelType)
    {
        await _dbContext.OMCFuelTypes.AddAsync(omcFuelType);
    }
}