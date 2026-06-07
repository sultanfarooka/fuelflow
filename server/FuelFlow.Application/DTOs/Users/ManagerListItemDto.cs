namespace FuelFlow.Application.DTOs.Users;

/// <summary>A station reference (id + name) for display in the managers list.</summary>
public class StationRefDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
}

/// <summary>
/// A Manager row for the Owner's user-management list ([M01-F05-R02]).
/// <see cref="PhoneConfirmed"/> doubles as the activation flag: false = invite
/// sent but not yet activated ("Pending OTP"); true = active.
/// </summary>
public class ManagerListItemDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public bool IsActive { get; set; }
    public bool PhoneConfirmed { get; set; }
    public List<StationRefDto> Stations { get; set; } = new();
}
