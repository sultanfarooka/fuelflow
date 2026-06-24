namespace FuelFlow.Application.DTOs.FuelNozzle;

/// <summary>
/// M08-F03: Response from <c>SetFuelNozzleActiveCommand</c>. Soft-deactivate
/// is intentionally NOT blocked by shift assignments (the whole point of the
/// toggle is "nozzle under maintenance"), so there's no <c>Blocked</c> /
/// <c>BlockingReferences</c> payload here — unlike <c>DeleteFuelNozzleResponse</c>.
/// </summary>
public class SetFuelNozzleActiveResponse
{
    public Guid NozzleId { get; set; }
    public bool IsActive { get; set; }
}
