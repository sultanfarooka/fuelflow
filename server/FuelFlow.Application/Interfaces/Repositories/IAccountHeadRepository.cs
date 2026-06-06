using FuelFlow.Domain.Entities;

namespace FuelFlow.Application.Interfaces.Repositories;

public interface IAccountHeadRepository
{
    Task<List<AccountHead>> GetAllAsync(Guid organizationId, int? type = null, CancellationToken ct = default);
    Task<AccountHead?> GetByIdAsync(Guid id, Guid organizationId, CancellationToken ct = default);
    Task<bool> ExistsByNameAsync(Guid organizationId, string name, CancellationToken ct = default);
    Task AddAsync(AccountHead accountHead, CancellationToken ct = default);
}
