namespace FuelFlow.Application.DTOs.Auth;

/// <summary>
/// The request payload for password login.
///
/// Phone-first per [M01-F09-R05]: <see cref="Identifier"/> accepts either a
/// Pakistani phone (<c>+92XXXXXXXXXX</c>) — the primary credential — or an email
/// address. Email resolution only succeeds when the email is set AND verified.
/// Login is universally gated on <c>PhoneNumberConfirmed</c> ([M01-F09-R03]).
/// </summary>
public class LoginRequest
{
    /// <summary>Phone (<c>+92XXXXXXXXXX</c>) or email address.</summary>
    public string Identifier { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;

    /// <summary>
    /// Optional device identifier for session tracking (e.g. browser fingerprint).
    /// </summary>
    public string? DeviceId { get; set; }
}
