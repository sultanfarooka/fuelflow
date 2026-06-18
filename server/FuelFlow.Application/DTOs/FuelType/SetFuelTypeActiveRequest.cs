namespace FuelFlow.Application.DTOs.FuelType;

/// <summary>
/// [M08-F08-R04] Request to activate or deactivate a fuel type for a station.
/// Station and fuel type are identified by the URL.
/// </summary>
public class SetFuelTypeActiveRequest
{
    public bool IsActive { get; set; }
}
