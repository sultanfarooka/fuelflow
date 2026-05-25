namespace FuelFlow.Application.DTOs.Auth;

/// <summary>
/// Request to re-issue a phone OTP for an existing pending verification ([M01-F09-R04]).
/// The handler looks up the most recent active OTP for this phone and re-issues
/// for the same purpose — the caller doesn't need to specify it.
/// </summary>
public class ResendOtpRequest
{
    /// <summary>Pakistani phone in <c>+92XXXXXXXXXX</c> format.</summary>
    public string Phone { get; set; } = string.Empty;
}
