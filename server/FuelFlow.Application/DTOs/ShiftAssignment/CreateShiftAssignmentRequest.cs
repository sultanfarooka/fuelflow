namespace FuelFlow.Application.DTOs.ShiftAssignment;

public class CreateShiftAssignmentRequest
{
    public Guid FuelNozzleId { get; set; }
    public Guid UserId { get; set; }
}
