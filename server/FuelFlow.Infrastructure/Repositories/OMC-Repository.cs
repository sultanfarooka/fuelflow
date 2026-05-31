using Microsoft.EntityFrameworkCore;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Infrastructure.Data;

public class OMCRepository : IOMCRepository
{
    private readonly ControlPlaneDbContext _dbContext;

    public OMCRepository(ControlPlaneDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<OMC>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.OMCs.OrderBy(o => o.Name).ToListAsync(cancellationToken);
    }

    public async Task AddAsync(OMC omc)
    {
        await _dbContext.OMCs.AddAsync(omc);
    }

    public async Task<OMC?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.OMCs.FindAsync(id);
    }
}
