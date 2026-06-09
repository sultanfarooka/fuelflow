using FuelFlow.Domain.Entities;

namespace FuelFlow.Application.Interfaces.Repositories;

public interface IFinancialEntryRepository
{
    Task<FinancialEntry?> GetByIdAsync(Guid id, Guid organizationId, CancellationToken ct = default);

    Task<(List<FinancialEntry> Items, int TotalCount)> GetListAsync(
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
        CancellationToken ct = default);

    Task<int> CountByAccountHeadAsync(Guid accountHeadId, Guid organizationId, CancellationToken ct = default);

    Task AddAsync(FinancialEntry entry, CancellationToken ct = default);

    Task AddRangeAsync(List<FinancialEntry> entries, CancellationToken ct = default);
}
