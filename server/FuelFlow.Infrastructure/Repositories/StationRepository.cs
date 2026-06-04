using Microsoft.EntityFrameworkCore;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Domain.Entities;
using FuelFlow.Infrastructure.Data;

namespace FuelFlow.Infrastructure.Repositories;

public class StationRepository : IStationRepository
{
    private readonly TenantDbContextAccessor _accessor;

    public StationRepository(TenantDbContextAccessor accessor)
    {
        _accessor = accessor;
    }

    public async Task<Station?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var ctx = await _accessor.GetContextAsync(cancellationToken);
        return await ctx.Stations
            .FirstOrDefaultAsync(s => s.Id == id && s.IsActive, cancellationToken);
    }

    public async Task<Station?> GetFirstByOrganizationIdAsync(Guid organizationId)
    {
        var ctx = await _accessor.GetContextAsync();
        return await ctx.Stations
            .FirstOrDefaultAsync(s => s.OrganizationId == organizationId && s.IsActive);
    }

    public async Task<List<Station>> GetByOrganizationIdAsync(Guid organizationId)
    {
        var ctx = await _accessor.GetContextAsync();
        return await ctx.Stations
            .Where(s => s.OrganizationId == organizationId && s.IsActive)
            .ToListAsync();
    }

    public async Task<List<Station>> GetByIdsAsync(IEnumerable<Guid> ids, CancellationToken cancellationToken = default)
    {
        var idList = ids.ToList();
        if (idList.Count == 0)
            return new List<Station>();

        var ctx = await _accessor.GetContextAsync(cancellationToken);
        return await ctx.Stations
            .Where(s => idList.Contains(s.Id) && s.IsActive)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> CountByOrganizationIdAsync(Guid organizationId, CancellationToken cancellationToken = default)
    {
        var ctx = await _accessor.GetContextAsync(cancellationToken);
        return await ctx.Stations
            .CountAsync(s => s.OrganizationId == organizationId && s.IsActive, cancellationToken);
    }

    public async Task AddAsync(Station station)
    {
        var ctx = await _accessor.GetContextAsync();
        await ctx.Stations.AddAsync(station);
    }
}
