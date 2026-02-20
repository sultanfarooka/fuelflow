namespace FuelFlow.Application.Interfaces.Services;

/// <summary>
/// Auth-related operations: verification emails, confirm email, resend, etc.
/// Implemented in Infrastructure (uses UserManager, IEmailSender).
/// </summary>
public interface IAuthService
{
    /// <summary>
    /// Sends verification email to the user. Generates token, builds link, sends email.
    /// Does not throw — returns false on failure (caller can still succeed; user can resend).
    /// </summary>
    Task<bool> SendVerificationEmailAsync(Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Sends password reset email to the user. Generates token, builds link, sends email.
    /// Returns false if user not found or send fails; caller should always return generic success for security.
    /// </summary>
    Task<bool> SendPasswordResetEmailAsync(string email, CancellationToken cancellationToken = default);
}
