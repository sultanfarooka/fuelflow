using System.Security.Cryptography;
using System.Text;
using FuelFlow.Application.Interfaces.Services;
using FuelFlow.Infrastructure.Services.Options;
using Microsoft.Extensions.Options;

namespace FuelFlow.Infrastructure.Services.Otp;

/// <summary>
/// HMAC-SHA256 OTP hasher with a server-side pepper from <see cref="OtpOptions.HashPepper"/>.
/// Deterministic so verification is a constant-time hash comparison.
/// </summary>
public sealed class OtpHasher : IOtpHasher
{
    private readonly OtpOptions _options;

    public OtpHasher(IOptions<OtpOptions> options)
    {
        _options = options.Value;
    }

    public string GenerateCode()
    {
        var length = _options.CodeLength <= 0 ? 6 : _options.CodeLength;
        var max = (int)Math.Pow(10, length);
        var n = RandomNumberGenerator.GetInt32(0, max);
        return n.ToString().PadLeft(length, '0');
    }

    public string Hash(string code)
    {
        var pepper = _options.HashPepper;
        if (string.IsNullOrWhiteSpace(pepper))
            throw new InvalidOperationException("Otp:HashPepper is not configured. Set a 32+ char secret via user-secrets or env vars.");

        var key = Encoding.UTF8.GetBytes(pepper);
        using var hmac = new HMACSHA256(key);
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(code));
        return Convert.ToBase64String(hash);
    }

    public bool Verify(string plaintextCode, string storedHash)
    {
        if (string.IsNullOrEmpty(plaintextCode) || string.IsNullOrEmpty(storedHash))
            return false;

        var computed = Hash(plaintextCode);
        // CryptographicOperations.FixedTimeEquals requires equal-length byte spans.
        var a = Encoding.UTF8.GetBytes(computed);
        var b = Encoding.UTF8.GetBytes(storedHash);
        return a.Length == b.Length && CryptographicOperations.FixedTimeEquals(a, b);
    }
}
