namespace FuelFlow.Application.Interfaces.Services;

/// <summary>
/// Provides metadata about the current HTTP request (IP, User-Agent).
/// Used when creating refresh tokens to track login sessions.
/// </summary>
public interface IRequestContextService
{
    /// <summary>
    /// Client IP address (RemoteIpAddress). May be null if not available.
    /// </summary>
    string? ClientIp { get; }

    /// <summary>
    /// User-Agent header value (browser/device info). May be null if not sent.
    /// </summary>
    string? UserAgent { get; }
}
