using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Domain.Entities;
using FuelFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace FuelFlow.Infrastructure.Repositories;

public class AccountHeadRepository : IAccountHeadRepository
{
    private readonly TenantDbContextAccessor _accessor;

    public AccountHeadRepository(TenantDbContextAccessor accessor) => _accessor = accessor;

    public async Task<List<AccountHead>> GetAllAsync(Guid organizationId, int? type = null, CancellationToken ct = default)
    {
        var ctx = await _accessor.GetContextAsync(ct);
        var query = ctx.AccountHeads
            .Where(a => a.OrganizationId == organizationId);

        if (type.HasValue)
            query = query.Where(a => (int)a.Type == type.Value);

        return await query.OrderBy(a => a.Name).ToListAsync(ct);
    }

    public async Task<AccountHead?> GetByIdAsync(Guid id, Guid organizationId, CancellationToken ct = default)
    {
        var ctx = await _accessor.GetContextAsync(ct);
        return await ctx.AccountHeads
            .FirstOrDefaultAsync(a => a.Id == id && a.OrganizationId == organizationId, ct);
    }

    public async Task<bool> ExistsByNameAsync(Guid organizationId, string name, CancellationToken ct = default)
    {
        var ctx = await _accessor.GetContextAsync(ct);
        return await ctx.AccountHeads
            .AnyAsync(a => a.OrganizationId == organizationId && a.Name == name, ct);
    }

    public async Task AddAsync(AccountHead accountHead, CancellationToken ct = default)
    {
        var ctx = await _accessor.GetContextAsync(ct);
        await ctx.AccountHeads.AddAsync(accountHead, ct);
    }
}
