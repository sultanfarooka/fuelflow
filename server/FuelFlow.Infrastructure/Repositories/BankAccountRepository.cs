using Microsoft.EntityFrameworkCore;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Domain.Entities;
using FuelFlow.Infrastructure.Data;

namespace FuelFlow.Infrastructure.Repositories;

public class BankAccountRepository : IBankAccountRepository
{
    private readonly TenantDbContextAccessor _accessor;

    public BankAccountRepository(TenantDbContextAccessor accessor)
    {
        _accessor = accessor;
    }

    public async Task<List<BankAccount>> GetByOrganizationIdAsync(Guid orgId, CancellationToken ct = default)
    {
        var ctx = await _accessor.GetContextAsync(ct);
        return await ctx.BankAccounts
            .Where(b => b.OrganizationId == orgId)
            .OrderByDescending(b => b.IsPrimary)
            .ThenBy(b => b.CreatedAt)
            .ToListAsync(ct);
    }

    public async Task AddAsync(BankAccount account)
    {
        var ctx = await _accessor.GetContextAsync();
        await ctx.BankAccounts.AddAsync(account);
    }

    public async Task DemotePrimaryAsync(Guid orgId, CancellationToken ct = default)
    {
        var ctx = await _accessor.GetContextAsync(ct);
        var primary = await ctx.BankAccounts
            .FirstOrDefaultAsync(b => b.OrganizationId == orgId && b.IsPrimary, ct);
        if (primary != null)
        {
            primary.IsPrimary = false;
            primary.UpdatedAt = DateTime.UtcNow;
        }
    }
}
