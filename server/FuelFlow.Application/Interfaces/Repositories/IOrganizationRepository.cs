using FuelFlow.Domain.Entities;

namespace FuelFlow.Application.Interfaces.Repositories;

/// <summary>
/// Repository interface for Organization entity.
/// Lives in Application (contract). Implemented in Infrastructure (uses DbContext).
/// </summary>
public interface IOrganizationRepository
{
    Task<Organization?> GetByIdAsync(Guid id);
    Task AddAsync(Organization organization);
}
