using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Domain.Entities;
using FuelFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace FuelFlow.Infrastructure.Repositories;

public class AccountHeadRepository : IAccountHeadRepository
{
    private readonly AppDbContext _db;

    public AccountHeadRepository(AppDbContext db) => _db = db;

    public async Task<List<AccountHead>> GetAllAsync(Guid organizationId, int? type = null, CancellationToken ct = default)
    {
        var query = _db.AccountHeads
            .Where(a => a.OrganizationId == organizationId);

        if (type.HasValue)
            query = query.Where(a => (int)a.Type == type.Value);

        return await query.OrderBy(a => a.Name).ToListAsync(ct);
    }

    public async Task<AccountHead?> GetByIdAsync(Guid id, Guid organizationId, CancellationToken ct = default)
        => await _db.AccountHeads
            .FirstOrDefaultAsync(a => a.Id == id && a.OrganizationId == organizationId, ct);

    public async Task<bool> ExistsByNameAsync(Guid organizationId, string name, CancellationToken ct = default)
        => await _db.AccountHeads
            .AnyAsync(a => a.OrganizationId == organizationId && a.Name == name, ct);

    public async Task AddAsync(AccountHead accountHead, CancellationToken ct = default)
        => await _db.AccountHeads.AddAsync(accountHead, ct);
}
