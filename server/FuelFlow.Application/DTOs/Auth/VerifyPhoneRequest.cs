namespace FuelFlow.Application.DTOs.Auth;

/// <summary>
/// Request to verify a phone OTP issued during signup ([M01-F09-R03]).
/// </summary>
public class VerifyPhoneRequest
{
    /// <summary>Pakistani phone in <c>+92XXXXXXXXXX</c> format.</summary>
    public string Phone { get; set; } = string.Empty;

    /// <summary>6-digit OTP the user typed in.</summary>
    public string Code { get; set; } = string.Empty;
}
