using Microsoft.EntityFrameworkCore;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Domain.Entities;
using FuelFlow.Infrastructure.Data;

namespace FuelFlow.Infrastructure.Repositories;

public class BankAccountRepository : IBankAccountRepository
{
    private readonly AppDbContext _dbContext;

    public BankAccountRepository(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<BankAccount>> GetByOrganizationIdAsync(Guid orgId, CancellationToken ct = default)
        => await _dbContext.BankAccounts
            .Where(b => b.OrganizationId == orgId)
            .OrderByDescending(b => b.IsPrimary)
            .ThenBy(b => b.CreatedAt)
            .ToListAsync(ct);

    public async Task AddAsync(BankAccount account)
        => await _dbContext.BankAccounts.AddAsync(account);

    public async Task DemotePrimaryAsync(Guid orgId, CancellationToken ct = default)
    {
        var primary = await _dbContext.BankAccounts
            .FirstOrDefaultAsync(b => b.OrganizationId == orgId && b.IsPrimary, ct);
        if (primary != null)
        {
            primary.IsPrimary = false;
            primary.UpdatedAt = DateTime.UtcNow;
        }
    }
}
