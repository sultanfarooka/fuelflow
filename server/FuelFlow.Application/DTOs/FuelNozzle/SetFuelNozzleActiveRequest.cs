namespace FuelFlow.Application.DTOs.FuelNozzle;

/// <summary>
/// M08-F03: Request to activate or deactivate a fuel nozzle. Mirrors
/// <c>SetFuelTypeActiveRequest</c> from M08-F08.
/// </summary>
public class SetFuelNozzleActiveRequest
{
    public bool IsActive { get; set; }
}
