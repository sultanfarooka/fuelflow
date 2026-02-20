using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using FuelFlow.Application.Interfaces.Services;

namespace FuelFlow.Infrastructure.Services;

/// <summary>
/// Sends emails via SMTP using MailKit.
/// Configure via appsettings: Email:SmtpHost, Email:SmtpPort, etc.
/// </summary>
public class SmtpEmailSender : IEmailSender
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<SmtpEmailSender> _logger;

    public SmtpEmailSender(IConfiguration configuration, ILogger<SmtpEmailSender> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendEmailAsync(string to, string subject, string htmlBody, CancellationToken cancellationToken = default)
    {
        var host = _configuration["Email:SmtpHost"];
        var port = _configuration.GetValue<int>("Email:SmtpPort", 587);
        var useSsl = _configuration.GetValue<bool>("Email:UseSsl", true);
        var username = _configuration["Email:Username"];
        var password = _configuration["Email:Password"];
        var fromAddress = _configuration["Email:FromAddress"] ?? "noreply@fuelflow.pk";
        var fromName = _configuration["Email:FromName"] ?? "Fuel Flow";

        if (string.IsNullOrWhiteSpace(host))
        {
            _logger.LogWarning("Email:SmtpHost not configured. Skipping email send to {To}", to);
            return;
        }

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(fromName, fromAddress));
        message.To.Add(MailboxAddress.Parse(to));
        message.Subject = subject;

        var builder = new BodyBuilder { HtmlBody = htmlBody };
        message.Body = builder.ToMessageBody();

        using var client = new SmtpClient();
        try
        {
            var secureSocketOptions = useSsl ? SecureSocketOptions.StartTls : SecureSocketOptions.None;
            await client.ConnectAsync(host, port, secureSocketOptions, cancellationToken);

            if (!string.IsNullOrWhiteSpace(username) && !string.IsNullOrWhiteSpace(password))
                await client.AuthenticateAsync(username, password, cancellationToken);

            await client.SendAsync(message, cancellationToken);
            _logger.LogInformation("Email sent to {To}", to);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {To}", to);
            throw;
        }
        finally
        {
            await client.DisconnectAsync(true, cancellationToken);
        }
    }
}
