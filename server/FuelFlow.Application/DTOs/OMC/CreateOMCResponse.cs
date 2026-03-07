namespace FuelFlow.Application.DTOs.OMC;

/// <summary>
/// Response after creating an OMC.
/// </summary>
public class CreateOMCResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
}
