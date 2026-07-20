using FuelFlow.Application.Interfaces.Services;
using FuelFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace FuelFlow.Infrastructure.Services;

/// <summary>
/// Real implementation of <see cref="IAccountHeadUsageChecker"/> that queries
/// the FinancialEntries table (M05-F11).
/// </summary>
public class AccountHeadUsageChecker : IAccountHeadUsageChecker
{
    private readonly TenantDbContextAccessor _accessor;

    public AccountHeadUsageChecker(TenantDbContextAccessor accessor) => _accessor = accessor;

    public async Task<bool> HasTransactionsAsync(Guid accountHeadId, CancellationToken ct = default)
    {
        var ctx = await _accessor.GetContextAsync(ct);
        return await ctx.FinancialEntries
            .AnyAsync(e => e.AccountHeadId == accountHeadId, ct);
    }
}
