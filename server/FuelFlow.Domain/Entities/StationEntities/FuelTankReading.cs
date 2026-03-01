using FuelFlow.Domain.Common;
using FuelFlow.Domain.Enums;

namespace FuelFlow.Domain.Entities;

/// <summary>
/// Plan: tank_dip_readings — shift_id optional; depth_cm, volume_liters (from dip chart), read_at.
/// </summary>
public class FuelTankReading : BaseEntity
{
    public Guid FuelTankId { get; set; }
    public FuelTank FuelTank { get; set; } = null!;

    public Guid? StationShiftId { get; set; }
    public StationShift? StationShift { get; set; }

    public ReadingType ReadingType { get; set; }
    public decimal DepthCm { get; set; }
    public decimal VolumeLiters { get; set; }
    public DateTime ReadAt { get; set; }

    public Guid? RecordedByUserId { get; set; }
    public User? RecordedBy { get; set; }
}