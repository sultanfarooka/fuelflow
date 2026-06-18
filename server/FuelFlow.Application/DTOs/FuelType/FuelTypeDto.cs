namespace FuelFlow.Application.DTOs.FuelType;

/// <summary>
/// DTO for fuel type in list responses (GET station fuel-types).
/// Source indicates origin: "OMC" = from station's OMC (OMCFuelTypes); "Custom" = user-created (FuelType with StationId set).
/// Only Custom fuel types have Id that can be used as FuelTypeId for tanks/prices; OMC types are for display/reference.
/// </summary>
public class FuelTypeDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Unit { get; set; } = "L";
    /// <summary>True when user-created for this station (FuelType); false when from station's OMC (OMCFuelTypes).</summary>
    public bool IsCustom { get; set; }
    public Guid? OMCId { get; set; } = null;
    /// <summary>"OMC" = from station's OMC catalog; "Custom" = station-specific custom type.</summary>
    public string Source { get; set; } = "Custom";

    /// <summary>M08-F08: whether the type is active for the station. Inactive types are hidden from new pickers.</summary>
    public bool IsActive { get; set; } = true;
    /// <summary>M08-F08: number of tanks referencing this fuel type at the station.</summary>
    public int TankCount { get; set; }
    /// <summary>M08-F08: true when a currently-effective price exists for this fuel type at the station.</summary>
    public bool HasActivePrice { get; set; }
    /// <summary>M08-F08-R06: a type is sellable only once it has an active price and at least one tank.</summary>
    public bool IsSellable => HasActivePrice && TankCount > 0;
}
