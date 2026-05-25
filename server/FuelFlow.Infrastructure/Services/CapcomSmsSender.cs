using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using FuelFlow.Application.Interfaces.Services;
using FuelFlow.Infrastructure.Services.Options;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace FuelFlow.Infrastructure.Services;

/// <summary>
/// Sends SMS via the self-hosted capcom6/sms-gateway (private mode).
/// Gateway contract: <c>POST /3rdparty/v1/message</c> with HTTP Basic auth.
/// Body: <c>{ "textMessage": { "text": "..." }, "phoneNumbers": ["+92..."] }</c>
/// Configure via <c>Sms:Gateway:*</c> — see <c>docs/ENV-MAP.md</c> and
/// <c>server/sms-gateway/README.md</c> for the gateway setup.
/// </summary>
public sealed class CapcomSmsSender : ISmsSender
{
    private const string SendPath = "3rdparty/v1/message";
    private const int MaxAttempts = 3;

    private readonly HttpClient _httpClient;
    private readonly SmsGatewayOptions _options;
    private readonly ILogger<CapcomSmsSender> _logger;

    public CapcomSmsSender(
        HttpClient httpClient,
        IOptions<SmsGatewayOptions> options,
        ILogger<CapcomSmsSender> logger)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _logger = logger;
    }

    public async Task SendSmsAsync(string toE164Phone, string body, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_options.BaseUrl))
        {
            _logger.LogWarning("Sms:Gateway:BaseUrl not configured. Skipping SMS send to {Phone}", Redact(toE164Phone));
            return;
        }

        var payload = new
        {
            textMessage = new { text = body },
            phoneNumbers = new[] { toE164Phone }
        };

        Exception? lastException = null;
        for (var attempt = 1; attempt <= MaxAttempts; attempt++)
        {
            try
            {
                using var response = await _httpClient.PostAsJsonAsync(SendPath, payload, cancellationToken);
                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation(
                        "SMS dispatched to {Phone} via capcom gateway (status {Status}, attempt {Attempt})",
                        Redact(toE164Phone), (int)response.StatusCode, attempt);
                    return;
                }

                _logger.LogWarning(
                    "SMS dispatch to {Phone} returned {Status} on attempt {Attempt}/{Max}",
                    Redact(toE164Phone), (int)response.StatusCode, attempt, MaxAttempts);

                // 4xx (except 408/429) is a client error — don't retry.
                var status = (int)response.StatusCode;
                if (status is >= 400 and < 500 and not 408 and not 429)
                {
                    response.EnsureSuccessStatusCode();
                }
                lastException = new HttpRequestException($"Gateway returned status {status}");
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                lastException = ex;
                _logger.LogWarning(ex,
                    "SMS dispatch to {Phone} threw on attempt {Attempt}/{Max}",
                    Redact(toE164Phone), attempt, MaxAttempts);
            }

            if (attempt < MaxAttempts)
            {
                // Exponential backoff: 200ms, 400ms.
                var delayMs = 200 * (1 << (attempt - 1));
                await Task.Delay(delayMs, cancellationToken);
            }
        }

        _logger.LogError(lastException, "Failed to send SMS to {Phone} after {Attempts} attempts", Redact(toE164Phone), MaxAttempts);
        throw lastException ?? new InvalidOperationException("SMS dispatch failed for unknown reason.");
    }

    /// <summary>
    /// Mask all but the last 4 digits — e.g. <c>+923001234567</c> → <c>+92*******4567</c>.
    /// Keeps audit-trail and Serilog output safe per the M01-F09 logging convention.
    /// </summary>
    private static string Redact(string phone)
    {
        if (string.IsNullOrEmpty(phone) || phone.Length <= 4) return "***";
        return string.Concat(phone.AsSpan(0, 3), new string('*', phone.Length - 7), phone.AsSpan(phone.Length - 4));
    }

    /// <summary>
    /// Builds the <c>Authorization: Basic base64(user:pass)</c> header value.
    /// Called by the DI registration when configuring the typed <see cref="HttpClient"/>.
    /// </summary>
    internal static AuthenticationHeaderValue BuildBasicAuthHeader(string username, string password)
    {
        var raw = Encoding.UTF8.GetBytes($"{username}:{password}");
        return new AuthenticationHeaderValue("Basic", Convert.ToBase64String(raw));
    }
}
