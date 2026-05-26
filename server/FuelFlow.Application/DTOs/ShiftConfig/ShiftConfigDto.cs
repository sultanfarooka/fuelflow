namespace FuelFlow.Application.DTOs.ShiftConfig;

public class ShiftConfigDto
{
    public Guid Id { get; set; }
    public Guid StationId { get; set; }
    public int ShiftCount { get; set; }
    public string Shift1Name { get; set; } = string.Empty;
    public TimeSpan Shift1StartTime { get; set; }
    public string Shift2Name { get; set; } = string.Empty;
    public TimeSpan Shift2StartTime { get; set; }
    public string? Shift3Name { get; set; }
    public TimeSpan? Shift3StartTime { get; set; }
}
