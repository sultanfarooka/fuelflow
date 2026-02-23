namespace FuelFlow.Api.Options;

/// <summary>
/// Cookie names for auth tokens. Used for HTTP-only secure cookie storage.
/// </summary>
public static class CookieConstants
{
    public const string AccessToken = "access_token";
    public const string RefreshToken = "refresh_token";
}
