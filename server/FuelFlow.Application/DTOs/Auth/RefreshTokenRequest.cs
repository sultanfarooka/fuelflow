namespace FuelFlow.Application.DTOs.Auth;

/// <summary>
/// Request payload for refreshing access tokens.
/// The client sends the refresh token it received from login/register.
/// </summary>
public class RefreshTokenRequest
{
    public string RefreshToken { get; set; } = string.Empty;

    /// <summary>
    /// Optional device identifier for session tracking (e.g. browser fingerprint).
    /// </summary>
    public string? DeviceId { get; set; }
}
