using FuelFlow.Application.Interfaces.Services;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FuelFlow.Infrastructure.Services;

/// <summary>
/// Dev/test <see cref="ISmsSender"/> that writes the message (including the OTP
/// code) to the API log instead of dispatching SMS. Lets the full M01-F09
/// signup / verify / recovery / phone-change flow run without FCM credentials
/// or a paired Android relay device — useful when Google Play Protect is
/// blocking the <c>capcom6/sms-gateway</c> Android app (see
/// <c>server/sms-gateway/README.md</c>) and on every fresh clone in general.
///
/// Selected by setting <c>Sms:Provider=console</c>, or implicitly in
/// <c>Development</c> when no provider is configured. The constructor logs a
/// <see cref="LogLevel.Warning"/> if it's wired up outside Development so
/// staging/prod can't silently leak OTPs to logs.
/// </summary>
public sealed class LogOnlySmsSender : ISmsSender
{
    private readonly ILogger<LogOnlySmsSender> _logger;

    public LogOnlySmsSender(ILogger<LogOnlySmsSender> logger, IHostEnvironment env)
    {
        _logger = logger;

        if (!env.IsDevelopment())
        {
            _logger.LogWarning(
                "Sms:Provider is set to 'console' in {Environment} — OTP codes will appear in plaintext in the API logs. This is intended for Development only.",
                env.EnvironmentName);
        }
    }

    public Task SendSmsAsync(string toE164Phone, string body, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "[LogOnlySmsSender] OTP for {Phone}: {Body}",
            Redact(toE164Phone),
            body);
        return Task.CompletedTask;
    }

    /// <summary>
    /// Mask all but the last 4 digits — kept locally to keep <see cref="CapcomSmsSender"/>'s
    /// helper private. If a third caller appears, extract to a shared helper.
    /// </summary>
    private static string Redact(string phone)
    {
        if (string.IsNullOrEmpty(phone) || phone.Length <= 4) return "***";
        return string.Concat(phone.AsSpan(0, 3), new string('*', phone.Length - 7), phone.AsSpan(phone.Length - 4));
    }
}
