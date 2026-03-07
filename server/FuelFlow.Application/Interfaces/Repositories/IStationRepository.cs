using FuelFlow.Domain.Entities;

namespace FuelFlow.Application.Interfaces.Repositories;

/// <summary>
/// Repository interface for Station entity.
/// Only the methods needed so far — we'll add more as other features require them.
/// </summary>
public interface IStationRepository
{
    Task<Station?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Station?> GetFirstByOrganizationIdAsync(Guid organizationId);
    Task<List<Station>> GetByOrganizationIdAsync(Guid organizationId);
    Task<List<Station>> GetByIdsAsync(IEnumerable<Guid> ids, CancellationToken cancellationToken = default);
    /// <summary>Count of active stations for the organization (for plan limit checks).</summary>
    Task<int> CountByOrganizationIdAsync(Guid organizationId, CancellationToken cancellationToken = default);
    Task AddAsync(Station station);
}
