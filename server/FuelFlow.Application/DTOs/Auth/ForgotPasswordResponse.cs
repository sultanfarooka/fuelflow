namespace FuelFlow.Application.DTOs.Auth;

/// <summary>
/// Response from <c>POST /auth/forgot-password</c> per [M01-F09-R08].
/// The wire shape supports a 2-step UX without leaking account existence:
/// - When no channel was chosen, <see cref="EligibleChannels"/> lists the
///   channels available for this account (empty when the account doesn't
///   exist or has no verified channel). The frontend uses the masked
///   targets to present a chooser.
/// - When the backend dispatched (single eligible channel OR caller chose an
///   eligible channel), <see cref="Dispatched"/> is true and the user should
///   be routed to the channel-specific reset screen.
/// </summary>
public class ForgotPasswordResponse
{
    public bool Success { get; set; } = true;

    public string Message { get; set; } = "If an account exists with that identifier, a recovery code has been sent.";

    /// <summary>Channels available for this user. <c>"sms"</c>, <c>"email"</c>, both, or none.</summary>
    public List<string> EligibleChannels { get; set; } = new();

    /// <summary>True when an OTP / email was actually sent on this request.</summary>
    public bool Dispatched { get; set; }

    /// <summary>The channel used when <see cref="Dispatched"/> is true.</summary>
    public string? ChannelUsed { get; set; }

    /// <summary>Masked phone (e.g. <c>+92*****4567</c>) when the SMS channel is available.</summary>
    public string? MaskedPhone { get; set; }

    /// <summary>Masked email (e.g. <c>j***@example.com</c>) when the email channel is available.</summary>
    public string? MaskedEmail { get; set; }
}
