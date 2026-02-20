using Microsoft.EntityFrameworkCore;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Domain.Entities;
using FuelFlow.Infrastructure.Data;

namespace FuelFlow.Infrastructure.Repositories;

/// <summary>
/// Concrete implementation of IOrganizationRepository.
/// 
/// This is the ONLY place that knows "Organizations are stored in PostgreSQL
/// via EF Core." If we ever switch to MongoDB or an API call, we change
/// this file and nothing else.
/// </summary>
public class OrganizationRepository : IOrganizationRepository
{
    private readonly AppDbContext _dbContext;

    public OrganizationRepository(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Organization?> GetByIdAsync(Guid id)
    {
        return await _dbContext.Organizations.FindAsync(id);
    }

    public async Task AddAsync(Organization organization)
    {
        await _dbContext.Organizations.AddAsync(organization);
    }
}
