using Microsoft.AspNetCore.Http;

namespace FuelFlow.Api.Options;

/// <summary>
/// Builds CookieOptions for auth tokens (access_token, refresh_token).
/// HttpOnly, Secure (prod only), SameSite=Lax, Path=/.
/// </summary>
public class AuthCookieOptions
{
    private readonly IConfiguration _configuration;
    private readonly IWebHostEnvironment _environment;

    public AuthCookieOptions(IConfiguration configuration, IWebHostEnvironment environment)
    {
        _configuration = configuration;
        _environment = environment;
    }

    /// <summary>
    /// Access token cookie: ~1h (from JWT ExpiresInMinutes).
    /// </summary>
    public CookieOptions GetAccessTokenOptions()
    {
        var expiresInMinutes = int.Parse(
            _configuration.GetSection("Jwt")["ExpiresInMinutes"] ?? "60");
        return new CookieOptions
        {
            HttpOnly = true,
            Secure = !_environment.IsDevelopment(),
            SameSite = SameSiteMode.Lax,
            Path = "/",
            MaxAge = TimeSpan.FromMinutes(expiresInMinutes),
        };
    }

    /// <summary>
    /// Refresh token cookie: 7 days (matches DB refresh token expiry).
    /// </summary>
    public CookieOptions GetRefreshTokenOptions()
    {
        return new CookieOptions
        {
            HttpOnly = true,
            Secure = !_environment.IsDevelopment(),
            SameSite = SameSiteMode.Lax,
            Path = "/",
            MaxAge = TimeSpan.FromDays(7),
        };
    }
}
