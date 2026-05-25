namespace FuelFlow.Application.Interfaces.Services;

/// <summary>
/// Generates and verifies one-time SMS codes for [M01-F09].
/// Codes are stored as HMAC-SHA256(server-pepper, code) — never plaintext.
/// </summary>
public interface IOtpHasher
{
    /// <summary>
    /// Generate a fresh numeric code of the configured length (default 6 digits).
    /// </summary>
    string GenerateCode();

    /// <summary>
    /// Hash a plaintext code for storage. Same input always produces the same output
    /// (deterministic HMAC) so <see cref="Verify"/> can do constant-time comparison.
    /// </summary>
    string Hash(string code);

    /// <summary>
    /// Constant-time compare of a user-supplied plaintext code against a stored hash.
    /// </summary>
    bool Verify(string plaintextCode, string storedHash);
}
