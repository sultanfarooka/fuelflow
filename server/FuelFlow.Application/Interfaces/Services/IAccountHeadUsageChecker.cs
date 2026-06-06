namespace FuelFlow.Application.Interfaces.Services;

public interface IAccountHeadUsageChecker
{
    /// <summary>
    /// Returns true if any financial entry references this account head.
    /// Always false until M05-F03 / M05-F10 / M05-F11 are built.
    /// </summary>
    Task<bool> HasTransactionsAsync(Guid accountHeadId, CancellationToken ct = default);
}
