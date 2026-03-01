using FuelFlow.Domain.Common;

namespace FuelFlow.Domain.Entities;

/// <summary>
/// A nozzle for a fuel tank.
/// Plan: nozzles — station_id, tank_id, nozzle_number.
/// </summary>
public class FuelNozzle : BaseEntity
{
    public string NozzleNumber { get; set; } = string.Empty; // e.g. N1, N2 — plan varchar(20)

    public Guid TankId { get; set; }
    public FuelTank FuelTank { get; set; } = null!;

    public Guid StationId { get; set; }
    public Station Station { get; set; } = null!;

    public bool IsActive { get; set; } = true;

    public ICollection<ShiftAssignment> ShiftAssignments { get; set; } = new List<ShiftAssignment>();
}
