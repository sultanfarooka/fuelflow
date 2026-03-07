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
}
