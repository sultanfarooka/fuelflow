using FuelFlow.Domain.Common;

namespace FuelFlow.Domain.Entities;

/// <summary>
/// Represents a long-lived refresh token used to obtain new access tokens
/// without re-entering credentials.
///
/// DESIGN NOTES (Domain layer):
/// - Inherits from BaseEntity → has Id, CreatedAt, UpdatedAt
/// - Tied to a User via UserId (multi-tenant awareness is indirect:
///   RefreshToken → User → Organization)
/// - Stores only a HASH of the token for security; the plaintext value is
///   only ever sent to the client and never stored.
/// - IsActive is a convenience property (not mapped logic) to check if the
///   token is currently usable.
/// </summary>
public class RefreshToken : BaseEntity
{
    /// <summary>
    /// The user this refresh token belongs to.
    /// </summary>
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    /// <summary>
    /// Hash of the refresh token string (e.g., SHA256).
    /// Never store the raw token in the database.
    /// </summary>
    public string TokenHash { get; set; } = string.Empty;

    /// <summary>
    /// When this refresh token expires and is no longer valid.
    /// </summary>
    public DateTime ExpiresAt { get; set; }

    /// <summary>
    /// When this token was revoked (e.g., on logout or rotation).
    /// Null means it has not been explicitly revoked.
    /// </summary>
    public DateTime? RevokedAt { get; set; }

    /// <summary>
    /// Optional reference to the replacement token identifier when this
    /// token is rotated. This makes it easier to trace token chains.
    /// </summary>
    public string? ReplacedByToken { get; set; }

    /// <summary>
    /// Optional metadata for security/audit: the IP address from which
    /// the token was created.
    /// </summary>
    public string? IpAddress { get; set; }

    /// <summary>
    /// Optional metadata for security/audit: user agent / device info.
    /// </summary>
    public string? UserAgent { get; set; }

    /// <summary>
    /// Optional client-provided device identifier for session tracking.
    /// E.g. browser fingerprint, device UUID from localStorage.
    /// </summary>
    public string? DeviceId { get; set; }

    /// <summary>
    /// Convenience property to indicate whether the token is currently active.
    /// Not a mapped column; derived from ExpiresAt and RevokedAt.
    /// </summary>
    public bool IsActive => RevokedAt == null && DateTime.UtcNow <= ExpiresAt;
}

