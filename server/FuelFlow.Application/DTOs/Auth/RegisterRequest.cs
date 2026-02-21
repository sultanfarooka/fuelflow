namespace FuelFlow.Application.DTOs.Auth;

/// <summary>
/// The request payload for owner self-registration.
///
/// Registration creates Owner user only.
/// Organization and first station are added during onboarding after first login.
/// </summary>
public class RegisterRequest
{
    // Owner info
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;

    /// <summary>
    /// Optional device identifier for session tracking (e.g. browser fingerprint).
    /// </summary>
    public string? DeviceId { get; set; }
}
