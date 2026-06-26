namespace FuelFlow.Application.DTOs.FuelNozzle;

/// <summary>
/// M08-F03: Response from <c>DeleteFuelNozzleCommand</c>. Same shape as the
/// M08-F02 <c>DeleteFuelTankResponse</c>. When <see cref="Blocked"/> is true
/// the controller maps the result to a 409 carrying
/// <see cref="BlockingReferences"/> so the UI can render a precise "still
/// in use by …" message.
/// </summary>
public class DeleteFuelNozzleResponse
{
    public Guid NozzleId { get; set; }
    public bool Blocked { get; set; }
    public List<string> BlockingReferences { get; set; } = new();
}
