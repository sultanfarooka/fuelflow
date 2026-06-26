using FuelFlow.Domain.Entities;

namespace FuelFlow.Application.Interfaces.Repositories;

/// <summary>
/// Repository for ShiftAssignment. Assigns users to nozzles for a shift.
/// </summary>
public interface IShiftAssignmentRepository
{
    Task<List<ShiftAssignment>> GetByShiftIdAsync(Guid stationShiftId, CancellationToken cancellationToken = default);
    Task<ShiftAssignment?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(ShiftAssignment shiftAssignment);

    /// <summary>M08-F03: count assignments referencing a single nozzle. Used by
    /// the Fuel Nozzles panel for the delete reference-guard and the
    /// "Assignments" column.</summary>
    Task<int> CountByNozzleIdAsync(Guid nozzleId, CancellationToken cancellationToken = default);

    /// <summary>M08-F03: batch variant — returns a map of nozzleId → count for
    /// every nozzle referenced by at least one assignment. Used by the panel's
    /// list query to avoid N+1.</summary>
    Task<Dictionary<Guid, int>> CountByNozzleIdsAsync(IEnumerable<Guid> nozzleIds, CancellationToken cancellationToken = default);
}
