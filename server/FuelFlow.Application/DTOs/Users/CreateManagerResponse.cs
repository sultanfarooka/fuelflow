namespace FuelFlow.Application.DTOs.Users;

/// <summary>
/// Result of creating a Manager ([M01-F05-R02]). <see cref="TemporaryPassword"/> is
/// populated only on the OTP-not-required path ([M01-F09-R07]) and is the single
/// time it is ever exposed — the Owner relays it to the Manager.
/// </summary>
public class CreateManagerResponse
{
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;

    /// <summary>True when the Manager must verify an SMS OTP before first login.</summary>
    public bool OtpRequired { get; set; }

    public string Message { get; set; } = string.Empty;

    /// <summary>One-time temporary password — set only when <c>OtpRequired</c> is false.</summary>
    public string? TemporaryPassword { get; set; }
}
