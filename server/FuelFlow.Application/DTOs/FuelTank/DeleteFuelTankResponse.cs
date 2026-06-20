namespace FuelFlow.Application.DTOs.FuelTank;

/// <summary>
/// Response from <c>DeleteFuelTankCommand</c> — mirrors the shape used by
/// <c>SetFuelTypeActiveCommand</c> for M08-F08. When <see cref="Blocked"/>
/// is true, the controller maps the result to a 409 Conflict carrying the
/// <see cref="BlockingReferences"/> list so the UI can render a precise
/// "still in use by …" message. When false, the delete succeeded.
/// </summary>
public class DeleteFuelTankResponse
{
    public Guid TankId { get; set; }
    public bool Blocked { get; set; }
    public List<string> BlockingReferences { get; set; } = new();
}
