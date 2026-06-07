namespace FuelFlow.Application.DTOs.Users;

/// <summary>
/// Owner-submitted payload to create a Manager user ([M01-F05-R02]).
/// Phone is the primary identifier (+92 format); email is optional. At least one
/// station must be assigned. <see cref="RequireOtp"/> defaults to true — the
/// per-user "verify phone before first login" toggle ([M01-F09-R07]).
/// </summary>
public class CreateManagerRequest
{
    public string FullName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }

    /// <summary>Stations (in the Owner's organization) this Manager is assigned to. At least one required.</summary>
    public List<Guid> StationIds { get; set; } = new();

    /// <summary>
    /// When true (default), the Manager must verify an SMS OTP and set their own
    /// password before first login. When false, the account is created already
    /// phone-confirmed with a one-time temporary password returned in the response.
    /// </summary>
    public bool RequireOtp { get; set; } = true;
}
