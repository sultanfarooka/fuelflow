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

    public async Task AddAsync(Station station)
    {
        await _dbContext.Stations.AddAsync(station);
    }
}
