namespace FuelFlow.Application.DTOs.OMC;

/// <summary>
/// DTO for OMC in list/get responses.
/// </summary>
public class OMCDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string? Phone { get; set; }
}
