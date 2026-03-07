using Microsoft.EntityFrameworkCore;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Domain.Entities;
using FuelFlow.Infrastructure.Data;

namespace FuelFlow.Infrastructure.Repositories;

public class StationRepository : IStationRepository
{
    private readonly AppDbContext _dbContext;

    public StationRepository(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Station?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Stations
            .FirstOrDefaultAsync(s => s.Id == id && s.IsActive, cancellationToken);
    }

    public async Task<Station?> GetFirstByOrganizationIdAsync(Guid organizationId)
    {
        return await _dbContext.Stations
            .FirstOrDefaultAsync(s => s.OrganizationId == organizationId && s.IsActive);
    }

    public async Task<List<Station>> GetByOrganizationIdAsync(Guid organizationId)
    {
        return await _dbContext.Stations
            .Where(s => s.OrganizationId == organizationId && s.IsActive)
            .ToListAsync();
    }

    public async Task<List<Station>> GetByIdsAsync(IEnumerable<Guid> ids, CancellationToken cancellationToken = default)
    {
        var idList = ids.ToList();
        if (idList.Count == 0)
            return new List<Station>();

        return await _dbContext.Stations
            .Where(s => idList.Contains(s.Id) && s.IsActive)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> CountByOrganizationIdAsync(Guid organizationId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Stations
            .CountAsync(s => s.OrganizationId == organizationId && s.IsActive, cancellationToken);
    }

    public async Task AddAsync(Station station)
    {
        await _dbContext.Stations.AddAsync(station);
    }
}
