namespace FuelFlow.Application.DTOs.Auth;

/// <summary>
/// The request payload for email/password login.
/// Simple — just email and password. Identity handles the rest
/// (password verification, lockout on failed attempts, etc.)
/// </summary>
public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;

    /// <summary>
    /// Optional device identifier for session tracking (e.g. browser fingerprint).
    /// </summary>
    public string? DeviceId { get; set; }
}
