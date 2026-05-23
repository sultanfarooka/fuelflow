namespace FuelFlow.Infrastructure.Services.Options;

/// <summary>
/// Strongly typed configuration for the self-hosted capcom6/sms-gateway.
/// Bound from the <c>Sms:Gateway</c> section (see <c>docs/ENV-MAP.md</c>).
/// </summary>
public sealed class SmsGatewayOptions
{
    public const string SectionName = "Sms:Gateway";

    /// <summary>
    /// Base URL for the gateway HTTP API. e.g. <c>http://sms-gateway:3000</c> on the
    /// internal docker network, or <c>http://localhost:3000</c> for local dev.
    /// </summary>
    public string BaseUrl { get; set; } = string.Empty;

    /// <summary>HTTP Basic auth username (gateway-configured device credential).</summary>
    public string Username { get; set; } = string.Empty;

    /// <summary>HTTP Basic auth password (gateway-configured device credential).</summary>
    public string Password { get; set; } = string.Empty;

    /// <summary>Optional sender ID / from-name when the gateway supports it. Not required.</summary>
    public string? SenderId { get; set; }
}
