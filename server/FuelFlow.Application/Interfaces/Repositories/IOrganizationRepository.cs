using FuelFlow.Domain.Entities;

namespace FuelFlow.Application.Interfaces.Repositories;

/// <summary>
/// Repository contract for the Organization entity.
/// Implemented in Infrastructure (EF Core). Used by auth and onboarding handlers to load org (and optionally stations).
/// </summary>
public interface IOrganizationRepository
{
    /// <summary>Loads an organization by id; navigation properties (e.g. Stations) are not included.</summary>
    Task<Organization?> GetByIdAsync(Guid id);

    /// <summary>Loads an organization by id with Stations included. Use when building auth responses to avoid a separate stations query when the user has no station assignments.</summary>
    Task<Organization?> GetByIdWithStationsAsync(Guid id, CancellationToken cancellationToken = default);

    Task AddAsync(Organization organization);
    Task DeleteAsync(Organization organization);
}
