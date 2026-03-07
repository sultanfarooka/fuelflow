using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using FuelFlow.Infrastructure.Identity;

namespace FuelFlow.Infrastructure.Services;

/// <summary>
/// Generates and validates JWT (JSON Web Tokens).
/// 
/// HOW JWT works (simplified):
/// 1. User logs in with email/password
/// 2. Server creates a JWT containing: userId, email, role, orgId
/// 3. Server signs it with a secret key (so nobody can tamper with it)
/// 4. Frontend stores the token and sends it with every API request
/// 5. Server verifies the signature on each request — no database lookup needed!
/// 
/// WHY JWT over session cookies?
/// - Stateless — server doesn't store sessions (scales better)
/// - Works across multiple servers (no sticky sessions needed)
/// - Frontend and backend can be on different domains
/// 
/// The token has an expiry (e.g., 1 hour). When it expires, the frontend
/// uses the refresh token to get a new access token without re-entering password.
/// </summary>
public class JwtTokenService
{
    private readonly IConfiguration _configuration;

    public JwtTokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    /// <summary>
    /// Generate an access token containing the user's claims (identity info).
    /// </summary>
    public string GenerateAccessToken(AppUser user, IList<string> userRoles)
    {
        var jwtSettings = _configuration.GetSection("Jwt");
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(jwtSettings["Secret"]!));

        // Claims = pieces of information embedded in the token
        // The frontend can read these (JWT is base64, not encrypted)
        // But it CANNOT modify them (the signature would break)
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email!),
            new(ClaimTypes.Name, user.FullName),
            new(ClaimTypes.Role, string.Join(",", userRoles)),
        };

        if (user.OrganizationId.HasValue)
        {
            claims.Add(new Claim("org_id", user.OrganizationId.Value.ToString()));
        }

        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiresInMinutes = int.Parse(jwtSettings["ExpiresInMinutes"] ?? "60");

        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiresInMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    /// <summary>
    /// Generate a random refresh token (opaque string, not a JWT).
    /// Stored in the database and used to get a new access token.
    /// </summary>
    public string GenerateRefreshToken()
    {
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return Convert.ToBase64String(randomBytes);
    }

    /// <summary>
    /// Compute a secure hash of a refresh token string before storing it.
    /// 
    /// WHY hash refresh tokens?
    /// - If the database is ever leaked, attackers cannot use the raw tokens
    ///   (similar to how we never store raw passwords).
    /// - We only need to compare hashes when validating a refresh request.
    /// </summary>
    public string HashRefreshToken(string refreshToken)
    {
        using var sha256 = SHA256.Create();
        var bytes = Encoding.UTF8.GetBytes(refreshToken);
        var hashBytes = sha256.ComputeHash(bytes);
        return Convert.ToBase64String(hashBytes);
    }

    /// <summary>
    /// Get the expiry time in seconds (for the API response).
    /// </summary>
    public int GetExpiresInSeconds()
    {
        var minutes = int.Parse(
            _configuration.GetSection("Jwt")["ExpiresInMinutes"] ?? "60");
        return minutes * 60;
    }
}
