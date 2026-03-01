using FuelFlow.Domain.Common;
using FuelFlow.Domain.Entities;

namespace FuelFlow.Domain.Entities;

/// <summary>
/// A type of fuel that can be sold at a station.
/// Plan: fuel_types — station_id NULL = predefined (seeded); otherwise per-station custom type.
/// </summary>
public class FuelType : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Unit { get; set; } = "L"; // e.g. L, kg — plan varchar(10)

    /// <summary>Null = predefined (seeded); set = custom type for this station.</summary>
    public Guid? StationId { get; set; }
    public Station? Station { get; set; }
}