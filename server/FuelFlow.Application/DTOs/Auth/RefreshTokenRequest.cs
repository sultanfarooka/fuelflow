namespace FuelFlow.Application.DTOs.Auth;

/// <summary>
/// Request payload for refreshing access tokens.
/// RefreshToken is optional when using HTTP-only cookies (controller reads from cookie).
/// </summary>
public class RefreshTokenRequest
{
    /// <summary>
    /// Refresh token. Optional when using cookies — controller reads from cookie when empty.
    /// </summary>
    public string? RefreshToken { get; set; }

    /// <summary>
    /// Optional device identifier for session tracking (e.g. browser fingerprint).
    /// </summary>
    public string? DeviceId { get; set; }
}
