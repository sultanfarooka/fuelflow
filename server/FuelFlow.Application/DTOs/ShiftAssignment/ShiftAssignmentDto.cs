namespace FuelFlow.Application.DTOs.ShiftAssignment;

public class ShiftAssignmentDto
{
    public Guid Id { get; set; }
    public Guid StationShiftId { get; set; }
    public Guid FuelNozzleId { get; set; }
    public string? NozzleNumber { get; set; }
    public Guid UserId { get; set; }
}
