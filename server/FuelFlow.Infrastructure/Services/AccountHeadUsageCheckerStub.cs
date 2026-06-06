using FuelFlow.Application.Interfaces.Services;

namespace FuelFlow.Infrastructure.Services;

/// <summary>
/// Stub implementation of <see cref="IAccountHeadUsageChecker"/> that always reports
/// no transactions. Until M05-F11 (Financial Ledger) ships, no entity references an
/// account head, so deactivation is never blocked on usage grounds.
/// </summary>
public class AccountHeadUsageCheckerStub : IAccountHeadUsageChecker
{
    // TODO M05-F03, M05-F10, M05-F11: replace with a real check that queries
    // FinancialEntries (or the relevant transaction tables) for AccountHeadId usage.
    public Task<bool> HasTransactionsAsync(Guid accountHeadId, CancellationToken ct = default)
        => Task.FromResult(false);
}
