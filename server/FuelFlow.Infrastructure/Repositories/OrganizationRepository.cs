using Microsoft.EntityFrameworkCore;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Domain.Entities;
using FuelFlow.Infrastructure.Data;

namespace FuelFlow.Infrastructure.Repositories;

public class OrganizationRepository : IOrganizationRepository
{
    private readonly TenantDbContextAccessor _accessor;

    public OrganizationRepository(TenantDbContextAccessor accessor)
    {
        _accessor = accessor;
    }

    public async Task<Organization?> GetByIdAsync(Guid id)
    {
        var ctx = await _accessor.GetContextAsync();
        return await ctx.Organizations.FindAsync(id);
    }

    public async Task<Organization?> GetByIdWithStationsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var ctx = await _accessor.GetContextAsync(cancellationToken);
        return await ctx.Organizations
            .AsNoTracking()
            .Include(o => o.Stations)
            .FirstOrDefaultAsync(o => o.Id == id, cancellationToken);
    }

    public async Task AddAsync(Organization organization)
    {
        var ctx = await _accessor.GetContextAsync();
        await ctx.Organizations.AddAsync(organization);
    }

    public Task DeleteAsync(Organization organization)
    {
        _accessor.Context.Organizations.Remove(organization);
        return Task.CompletedTask;
    }
}
