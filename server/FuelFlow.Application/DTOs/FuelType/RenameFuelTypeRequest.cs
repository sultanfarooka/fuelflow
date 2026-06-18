namespace FuelFlow.Application.DTOs.FuelType;

/// <summary>
/// [M08-F08-R03] Request to rename a fuel type's display name for a station.
/// Applies to both OMC-derived and custom per-station rows (the shared OMC
/// catalog is untouched). Station and fuel type are identified by the URL.
/// </summary>
public class RenameFuelTypeRequest
{
    public string Name { get; set; } = string.Empty;
}
