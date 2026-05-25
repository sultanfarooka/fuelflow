namespace FuelFlow.Application.Interfaces.Services;

/// <summary>
/// Sends SMS messages (signup OTP, password-recovery OTP, phone-change OTP).
/// Implemented in Infrastructure against the self-hosted capcom6/sms-gateway.
/// See [M01-F09-R10] for the platform-default sender requirement.
/// </summary>
public interface ISmsSender
{
    /// <summary>
    /// Sends an SMS to the specified recipient.
    /// </summary>
    /// <param name="toE164Phone">Recipient phone in E.164 format (e.g. <c>+923001234567</c>).</param>
    /// <param name="body">Plain-text message body.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    Task SendSmsAsync(string toE164Phone, string body, CancellationToken cancellationToken = default);
}
