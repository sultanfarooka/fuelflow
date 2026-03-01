using FuelFlow.Domain.Common;
using FuelFlow.Domain.Enums;

namespace FuelFlow.Domain.Entities;

/// <summary>
/// Plan: meter_readings — nozzle_id, shift_id, reading_type (Opening/Closing), totalizer_value, recorded_at.
/// </summary>
public class NozzleReadings : BaseEntity
{
    public Guid FuelNozzleId { get; set; }
    public FuelNozzle FuelNozzle { get; set; } = null!;

    public Guid StationShiftId { get; set; }
    public StationShift StationShift { get; set; } = null!;

    public ReadingType ReadingType { get; set; }
    public decimal TotalizerValue { get; set; }
    public DateTime RecordedAt { get; set; }

    public Guid? RecordedByUserId { get; set; }
    public User? RecordedBy { get; set; }
}
