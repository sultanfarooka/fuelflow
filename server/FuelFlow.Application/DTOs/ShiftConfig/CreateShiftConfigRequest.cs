namespace FuelFlow.Application.DTOs.ShiftConfig;

public class CreateShiftConfigRequest
{
    public int ShiftCount { get; set; }
    public string Shift1Name { get; set; } = string.Empty;
    public string Shift1StartTime { get; set; } = string.Empty;
    public string Shift2Name { get; set; } = string.Empty;
    public string Shift2StartTime { get; set; } = string.Empty;
    public string? Shift3Name { get; set; }
    public string? Shift3StartTime { get; set; }
}
