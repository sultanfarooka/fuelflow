using FuelFlow.Domain.Common;

namespace FuelFlow.Domain.Entities;

/// <summary>
/// Plan: shift_assignments — Manager/Owner assigns nozzlemen to nozzles for a shift.
/// One user can have multiple assignments (multiple nozzles) per shift.
/// </summary>
public class ShiftAssignment : BaseEntity
{
    public Guid StationShiftId { get; set; }
    public StationShift StationShift { get; set; } = null!;

    public Guid FuelNozzleId { get; set; }
    public FuelNozzle FuelNozzle { get; set; } = null!;

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
}
