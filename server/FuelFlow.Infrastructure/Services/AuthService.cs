using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using FuelFlow.Application.Interfaces.Services;
using FuelFlow.Infrastructure.Identity;

namespace FuelFlow.Infrastructure.Services;

/// <summary>
/// Auth operations: verification emails, confirm email, resend.
/// Uses UserManager for token generation and IEmailSender for delivery.
/// </summary>
public class AuthService : IAuthService
{
    private readonly UserManager<AppUser> _userManager;
    private readonly IEmailSender _emailSender;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        UserManager<AppUser> userManager,
        IEmailSender emailSender,
        IConfiguration configuration,
        ILogger<AuthService> logger)
    {
        _userManager = userManager;
        _emailSender = emailSender;
        _configuration = configuration;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<bool> SendVerificationEmailAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
        {
            _logger.LogWarning("User {UserId} not found for verification email", userId);
            return false;
        }

        try
        {
            var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
            var frontendUrl = _configuration["FrontendUrl"]?.TrimEnd('/') ?? "http://localhost:5173";
            var verifyUrl = $"{frontendUrl}/auth/verify-email?token={Uri.EscapeDataString(token)}&userId={user.Id}";

            var htmlBody = $@"
                <h2>Verify your Fuel Flow account</h2>
                <p>Hi {user.FullName},</p>
                <p>Please click the link below to verify your email address:</p>
                <p><a href=""{verifyUrl}"">Verify my email</a></p>
                <p>If you didn't create an account, you can ignore this email.</p>
                <p>This link expires in 24 hours.</p>
            ";

            await _emailSender.SendEmailAsync(user.Email!, "Verify your Fuel Flow account", htmlBody, cancellationToken);
            return true;
        }
        catch (Exception)
        {
            return false; // SmtpEmailSender already logged the error
        }
    }

    /// <inheritdoc />
    public async Task<bool> SendPasswordResetEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByEmailAsync(email);
        if (user == null || !user.IsActive)
        {
            _logger.LogWarning("User not found or inactive for password reset: {Email}", email);
            return false;
        }

        try
        {
            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var frontendUrl = _configuration["FrontendUrl"]?.TrimEnd('/') ?? "http://localhost:5173";
            var resetUrl = $"{frontendUrl}/reset-password?token={Uri.EscapeDataString(token)}&userId={user.Id}";

            var htmlBody = $@"
                <h2>Reset your Fuel Flow password</h2>
                <p>Hi {user.FullName},</p>
                <p>We received a request to reset your password. Click the link below to set a new one:</p>
                <p><a href=""{resetUrl}"">Reset my password</a></p>
                <p>If you didn't request this, you can ignore this email. Your password will stay the same.</p>
                <p>This link expires in 24 hours.</p>
            ";

            await _emailSender.SendEmailAsync(user.Email!, "Reset your Fuel Flow password", htmlBody, cancellationToken);
            return true;
        }
        catch (Exception)
        {
            return false; // SmtpEmailSender already logged the error
        }
    }
}
