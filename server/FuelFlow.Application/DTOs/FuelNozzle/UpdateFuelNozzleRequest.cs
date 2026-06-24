namespace FuelFlow.Application.DTOs.FuelNozzle;

/// <summary>
/// M08-F03: Request to update a fuel nozzle's number or tank assignment.
/// Does NOT touch <c>IsActive</c> — that's the dedicated <c>PATCH .../status</c>
/// endpoint, matching the rename-vs-activate split used by M08-F08.
/// </summary>
public class UpdateFuelNozzleRequest
{
    public string NozzleNumber { get; set; } = string.Empty;
    public Guid TankId { get; set; }
}
