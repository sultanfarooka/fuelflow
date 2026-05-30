using FuelFlow.Domain.Common;

namespace FuelFlow.Domain.Entities.StationEntities;

/// <summary>
/// Shift schedule configured for a station during onboarding (M12-F01-R08).
/// Supports 2 or 3 shifts per day; Shift3 fields are nullable for 2-shift stations.
/// </summary>
public class StationShiftConfig : BaseEntity
{
    public Guid StationId { get; set; }
    public int ShiftCount { get; set; }

    public string Shift1Name { get; set; } = string.Empty;
    public TimeSpan Shift1StartTime { get; set; }

    public string Shift2Name { get; set; } = string.Empty;
    public TimeSpan Shift2StartTime { get; set; }

    public string? Shift3Name { get; set; }
    public TimeSpan? Shift3StartTime { get; set; }

    public Station Station { get; set; } = null!;
}
