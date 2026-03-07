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
}
