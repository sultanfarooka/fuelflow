namespace FuelFlow.Application.DTOs.FuelType;

/// <summary>
/// [M08-F08-R04/R05] Outcome of a set-active request. When a deactivation is
/// blocked by references, <see cref="Blocked"/> is true and
/// <see cref="BlockingReferences"/> lists the human-readable reasons; the
/// controller maps that to HTTP 409. On a successful change, <see cref="IsActive"/>
/// reflects the new state.
/// </summary>
public class SetFuelTypeActiveResponse
{
    public Guid FuelTypeId { get; set; }
    public bool IsActive { get; set; }
    public bool Blocked { get; set; }
    public List<string> BlockingReferences { get; set; } = new();
}
