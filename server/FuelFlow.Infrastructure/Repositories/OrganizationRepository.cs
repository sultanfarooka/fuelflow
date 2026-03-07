using Microsoft.EntityFrameworkCore;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Domain.Entities;
using FuelFlow.Infrastructure.Data;

namespace FuelFlow.Infrastructure.Repositories;

/// <summary>
/// EF Core implementation of <see cref="IOrganizationRepository"/>.
/// All organization persistence and queries go through this class; auth/onboarding handlers use it to load org (and optionally stations).
/// </summary>
public class OrganizationRepository : IOrganizationRepository
{
    private readonly AppDbContext _dbContext;

    public OrganizationRepository(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    /// <inheritdoc />
    public async Task<Organization?> GetByIdAsync(Guid id)
    {
        return await _dbContext.Organizations.FindAsync(id);
    }

    /// <inheritdoc />
    /// <remarks>Uses AsNoTracking and Include(Stations) so auth handlers can use organization.Stations when resolving the user's station list without an extra query.</remarks>
    public async Task<Organization?> GetByIdWithStationsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Organizations
            .AsNoTracking()
            .Include(o => o.Stations)
            .FirstOrDefaultAsync(o => o.Id == id, cancellationToken);
    }

    public async Task AddAsync(Organization organization)
    {
        await _dbContext.Organizations.AddAsync(organization);
    }

    public Task DeleteAsync(Organization organization)
    {
        _dbContext.Organizations.Remove(organization);
        return Task.CompletedTask;
    }

}
