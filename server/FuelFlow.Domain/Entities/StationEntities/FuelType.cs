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
    public bool IsCustom { get; set; } = false;
    public Guid? OMCId { get; set; } = null;

    /// <summary>
    /// M08-F08: whether this fuel type is active for its station. Deactivated
    /// types drop out of new price/tank/nozzle pickers but are retained for
    /// historical reporting. Applies to both OMC-derived and custom per-station
    /// rows. Legacy rows default to active.
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>Null = predefined (seeded); set = custom type for this station.</summary>
    /// <remarks>
    /// M14-F01: the previous <c>Station? Station</c> navigation was dropped because it
    /// pointed from a control-plane entity (FuelType) into a per-tenant entity
    /// (Station). EF Core would otherwise pull Station's entire tree into the
    /// control-plane model. <see cref="StationId"/> remains as a plain nullable Guid;
    /// app-layer code resolves the Station against AppDbContext when needed.
    /// </remarks>
    public Guid? StationId { get; set; }
}