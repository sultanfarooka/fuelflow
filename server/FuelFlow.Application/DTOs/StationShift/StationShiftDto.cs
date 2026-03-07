using FuelFlow.Domain.Enums;

namespace FuelFlow.Application.DTOs.StationShift;

public class StationShiftDto
{
    public Guid Id { get; set; }
    public Guid StationId { get; set; }
    public ShiftStatus Status { get; set; }
    public DateTime OpenedAt { get; set; }
    public DateTime? ClosedAt { get; set; }
    public decimal OpeningCash { get; set; }
    public decimal? ClosingCash { get; set; }
    public string? ShiftName { get; set; }
    public Guid OpenedByUserId { get; set; }
    public Guid? ClosedByUserId { get; set; }
}
