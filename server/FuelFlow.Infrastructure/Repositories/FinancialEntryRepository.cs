using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Domain.Entities;
using FuelFlow.Domain.Enums;
using FuelFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace FuelFlow.Infrastructure.Repositories;

public class FinancialEntryRepository : IFinancialEntryRepository
{
    private readonly TenantDbContextAccessor _accessor;

    public FinancialEntryRepository(TenantDbContextAccessor accessor) => _accessor = accessor;

    public async Task<FinancialEntry?> GetByIdAsync(Guid id, Guid organizationId, CancellationToken ct = default)
    {
        var ctx = await _accessor.GetContextAsync(ct);
        return await ctx.FinancialEntries
            .Include(e => e.AccountHead)
            .FirstOrDefaultAsync(e => e.Id == id && e.OrganizationId == organizationId, ct);
    }

    public async Task<(List<FinancialEntry> Items, int TotalCount)> GetListAsync(
        Guid organizationId,
        Guid? stationId = null,
        DateTime? dateFrom = null,
        DateTime? dateTo = null,
        string? entryType = null,
        string? paymentMethod = null,
        Guid? accountHeadId = null,
        Guid? bankAccountId = null,
        int page = 1,
        int pageSize = 20,
        string sortBy = "date",
        string sortOrder = "desc",
        CancellationToken ct = default)
    {
        var ctx = await _accessor.GetContextAsync(ct);
        var query = ctx.FinancialEntries
            .Include(e => e.AccountHead)
            .Where(e => e.OrganizationId == organizationId);

        if (stationId.HasValue)
            query = query.Where(e => e.StationId == stationId.Value);
        if (dateFrom.HasValue)
            query = query.Where(e => e.Date >= dateFrom.Value);
        if (dateTo.HasValue)
            query = query.Where(e => e.Date <= dateTo.Value);
        if (!string.IsNullOrWhiteSpace(entryType) && Enum.TryParse<FinancialEntryType>(entryType, true, out var parsedType))
            query = query.Where(e => e.EntryType == parsedType);
        if (!string.IsNullOrWhiteSpace(paymentMethod) && Enum.TryParse<PaymentMethod>(paymentMethod, true, out var parsedMethod))
            query = query.Where(e => e.PaymentMethod == parsedMethod);
        if (accountHeadId.HasValue)
            query = query.Where(e => e.AccountHeadId == accountHeadId.Value);
        if (bankAccountId.HasValue)
            query = query.Where(e => e.BankAccountId == bankAccountId.Value);

        var totalCount = await query.CountAsync(ct);

        query = sortBy.ToLowerInvariant() switch
        {
            "amount" => sortOrder.Equals("asc", StringComparison.OrdinalIgnoreCase)
                ? query.OrderBy(e => e.Amount)
                : query.OrderByDescending(e => e.Amount),
            "entrytype" => sortOrder.Equals("asc", StringComparison.OrdinalIgnoreCase)
                ? query.OrderBy(e => e.EntryType)
                : query.OrderByDescending(e => e.EntryType),
            _ => sortOrder.Equals("asc", StringComparison.OrdinalIgnoreCase)
                ? query.OrderBy(e => e.Date).ThenBy(e => e.CreatedAt)
                : query.OrderByDescending(e => e.Date).ThenByDescending(e => e.CreatedAt),
        };

        // Cap page size
        if (pageSize > 100) pageSize = 100;
        if (pageSize < 1) pageSize = 20;
        if (page < 1) page = 1;

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return (items, totalCount);
    }

    public async Task<int> CountByAccountHeadAsync(Guid accountHeadId, Guid organizationId, CancellationToken ct = default)
    {
        var ctx = await _accessor.GetContextAsync(ct);
        return await ctx.FinancialEntries
            .CountAsync(e => e.AccountHeadId == accountHeadId && e.OrganizationId == organizationId, ct);
    }

    public async Task AddAsync(FinancialEntry entry, CancellationToken ct = default)
    {
        var ctx = await _accessor.GetContextAsync(ct);
        await ctx.FinancialEntries.AddAsync(entry, ct);
    }

    public async Task AddRangeAsync(List<FinancialEntry> entries, CancellationToken ct = default)
    {
        var ctx = await _accessor.GetContextAsync(ct);
        await ctx.FinancialEntries.AddRangeAsync(entries, ct);
    }
}
