using FuelFlow.Domain.Common;

namespace FuelFlow.Domain.Entities;

/// <summary>
/// A fuel tank is a physical container for storing fuel.
/// Plan: tanks — capacity_liters (decimal), name optional.
/// </summary>
public class FuelTank : BaseEntity
{
    public string? Name { get; set; }
    public decimal CapacityLiters { get; set; }

    // Cross-context FK — references control-plane FuelType by plain Guid (M14-F02).
    // Nav property dropped; handlers use IFuelTypeRepository for lookups.
    public Guid FuelTypeId { get; set; }

    public Guid StationId { get; set; }
    public Station Station { get; set; } = null!;

    public DipChart DipChart { get; set; } = null!;
}

/// <summary>
/// A dip chart is a table that converts depth in centimeters to volume in liters.
/// The dip chart is associated with a fuel tank.
/// </summary>
public class DipChart : BaseEntity
{
    public Guid TankId { get; set; }
    public FuelTank FuelTank { get; set; } = null!;
    public ICollection<DipChartEntry> Entries { get; set; } = new List<DipChartEntry>();
}

/// <summary>
/// Plan: dip_chart_entries — depth_cm, volume_liters per dip chart.
/// </summary>
public class DipChartEntry : BaseEntity
{
    public Guid DipChartId { get; set; }
    public DipChart DipChart { get; set; } = null!;
    public decimal DepthCm { get; set; }
    public decimal VolumeLiters { get; set; }
}
