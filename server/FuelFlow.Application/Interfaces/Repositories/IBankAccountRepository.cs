using FuelFlow.Domain.Entities;

namespace FuelFlow.Application.Interfaces.Repositories;

public interface IBankAccountRepository
{
    Task<List<BankAccount>> GetByOrganizationIdAsync(Guid orgId, CancellationToken ct = default);
    Task AddAsync(BankAccount account);
    Task DemotePrimaryAsync(Guid orgId, CancellationToken ct = default);
}
