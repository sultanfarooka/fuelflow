namespace FuelFlow.Application.DTOs.Auth;

/// <summary>
/// Request to begin password recovery. Per [M01-F09-R08] / [M01-F04-R04] the
/// user identifies themselves by phone or email; the backend reports which
/// channels are eligible and, on the second submit, dispatches via the chosen
/// channel. If only one channel is eligible the backend dispatches immediately.
/// </summary>
public class ForgotPasswordRequest
{
    /// <summary>Phone (<c>+92XXXXXXXXXX</c>) or email address.</summary>
    public string Identifier { get; set; } = string.Empty;

    /// <summary>
    /// Optional. <c>"sms"</c> or <c>"email"</c>. Null on the first submit means
    /// "tell me which channels are eligible." When supplied and eligible, the
    /// backend dispatches via that channel.
    /// </summary>
    public string? Channel { get; set; }
}
