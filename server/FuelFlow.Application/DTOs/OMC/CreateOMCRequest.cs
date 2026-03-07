namespace FuelFlow.Application.DTOs.OMC;

/// <summary>
/// Request to create a new OMC (Oil Marketing Company).
/// </summary>
public class CreateOMCRequest
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? Phone { get; set; }
    public string? Website { get; set; }
    public string? LogoUrl { get; set; }
    public string? ContactPerson { get; set; }
    public string? ContactPersonEmail { get; set; }
    public string? ContactPersonPhone { get; set; }
}
