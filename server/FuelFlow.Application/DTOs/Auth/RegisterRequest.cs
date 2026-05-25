namespace FuelFlow.Application.DTOs.Auth;

/// <summary>
/// The request payload for owner self-registration.
///
/// Registration creates Owner user only.
/// Organization and first station are added during onboarding after first login.
///
/// Phone-first per [M01-F09-R01]: phone is required, email is optional.
/// When email is provided it must be unique ([M01-F01-R01]) and a verification
/// email is dispatched alongside the SMS OTP.
/// </summary>
public class RegisterRequest
{
    // Owner info
    public string FullName { get; set; } = string.Empty;

    /// <summary>Optional email. When provided, must be unique and will receive a verification link.</summary>
    public string? Email { get; set; }

    /// <summary>Required Pakistani phone in <c>+92XXXXXXXXXX</c> format.</summary>
    public string Phone { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;

    /// <summary>
    /// Optional device identifier for session tracking (e.g. browser fingerprint).
    /// </summary>
    public string? DeviceId { get; set; }
}
