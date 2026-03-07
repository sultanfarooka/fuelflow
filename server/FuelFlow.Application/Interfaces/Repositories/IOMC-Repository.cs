using FuelFlow.Domain.Entities;

namespace FuelFlow.Application.Interfaces.Repositories;

/// <summary>
/// Repository interface for OMC entity.
/// </summary>
public interface IOMCRepository
{
    Task<IReadOnlyList<OMC>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<OMC?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(OMC omc);
}