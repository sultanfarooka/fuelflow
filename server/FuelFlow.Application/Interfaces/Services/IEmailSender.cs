namespace FuelFlow.Application.Interfaces.Services;

/// <summary>
/// Sends emails (verification, password reset, etc.).
/// Implemented in Infrastructure with MailKit/SMTP.
/// </summary>
public interface IEmailSender
{
    /// <summary>
    /// Sends an email to the specified recipient.
    /// </summary>
    /// <param name="to">Recipient email address</param>
    /// <param name="subject">Email subject</param>
    /// <param name="htmlBody">HTML body of the email</param>
    /// <param name="cancellationToken">Cancellation token</param>
    Task SendEmailAsync(string to, string subject, string htmlBody, CancellationToken cancellationToken = default);
}
