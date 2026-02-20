namespace FuelFlow.Application.DTOs.Auth;

/// <summary>
/// Request to reset password using token from the reset link.
/// </summary>
public class ResetPasswordRequest
{
    public Guid UserId { get; set; }
    public string Token { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}
