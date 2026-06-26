namespace FuelFlow.Application.DTOs.FuelNozzle;

public class FuelNozzleDto
{
    public Guid Id { get; set; }
    public string NozzleNumber { get; set; } = string.Empty;
    public Guid TankId { get; set; }
    public string? TankName { get; set; }
    public Guid StationId { get; set; }
    public bool IsActive { get; set; }

    /// <summary>M08-F03: number of ShiftAssignments referencing this nozzle.
    /// Drives the delete reference-guard and the panel's "Assignments" column.</summary>
    public int ShiftAssignmentCount { get; set; }
}
