namespace FuelFlow.Infrastructure.Services.Options;

/// <summary>
/// Strongly typed configuration for the OTP subsystem ([M01-F09-R04], [M01-F09-R12]).
/// Bound from the <c>Otp</c> section (see <c>docs/ENV-MAP.md</c>).
/// </summary>
public sealed class OtpOptions
{
    public const string SectionName = "Otp";

    /// <summary>How many digits each OTP code contains. Default 6.</summary>
    public int CodeLength { get; set; } = 6;

    /// <summary>Lifetime of a fresh code in minutes. Default 5.</summary>
    public int TtlMinutes { get; set; } = 5;

    /// <summary>Max verify attempts against a single code before it is treated as exhausted. Default 3.</summary>
    public int MaxAttempts { get; set; } = 3;

    /// <summary>Minimum seconds between successive resends per user. Default 60.</summary>
    public int ResendCooldownSeconds { get; set; } = 60;

    /// <summary>Max OTPs that may be issued per phone in a 24h window ([M01-F09-R12]). Default 10.</summary>
    public int DailyCapPerPhone { get; set; } = 10;

    /// <summary>HMAC-SHA256 key used to hash codes at rest. Required when phone-OTP is enabled. Must be 32+ chars.</summary>
    public string HashPepper { get; set; } = string.Empty;
}
