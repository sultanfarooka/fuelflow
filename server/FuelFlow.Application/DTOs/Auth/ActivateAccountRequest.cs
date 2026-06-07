namespace FuelFlow.Application.DTOs.Auth;

/// <summary>
/// One-step account activation for an invited sub-user ([M01-F05-R02], [M01-F09-R07]):
/// verifies the signup-purpose SMS OTP and sets the user's first password in a single
/// call. Reuses the existing OTP infrastructure ([M01-F09]).
/// </summary>
public class ActivateAccountRequest
{
    public string Phone { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}
