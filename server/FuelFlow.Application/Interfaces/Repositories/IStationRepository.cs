using FuelFlow.Domain.Entities;

namespace FuelFlow.Application.Interfaces.Repositories;

/// <summary>
/// Repository interface for Station entity.
/// Only the methods needed so far — we'll add more as other features require them.
/// </summary>
public interface IStationRepository
{
    Task<Station?> GetFirstByOrganizationIdAsync(Guid organizationId);
    Task<List<Station>> GetByOrganizationIdAsync(Guid organizationId);
    Task AddAsync(Station station);
}
