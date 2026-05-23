namespace FuelFlow.Application.DTOs.Auth;

/// <summary>
/// Reset password using an SMS OTP delivered by the forgot-password SMS branch.
/// See [M01-F09-R08] and [M01-F04-R04].
/// </summary>
public class ResetPasswordWithOtpRequest
{
    public string Phone { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}
