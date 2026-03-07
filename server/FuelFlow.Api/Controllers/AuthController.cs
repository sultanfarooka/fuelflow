using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FuelFlow.Application.DTOs.Auth;
using FuelFlow.Application.Features.Auth.Commands;
using FuelFlow.Application.Features.Auth.Queries;
using FuelFlow.Api.Options;

namespace FuelFlow.Api.Controllers;

/// <summary>
/// Authentication endpoints: register, login, get current user.
/// 
/// WHY is this controller so thin?
/// - Controllers should only: receive request → send command/query → return response
/// - NO business logic here (that's in MediatR handlers)
/// - NO database access here (that's in repositories)
/// - This makes the controller easy to read and test
/// 
/// ROUTE: /api/v1/auth/...
/// The [Route] attribute sets the base path. [action] maps to the method name.
/// 
/// Tokens are stored in HTTP-only cookies. JSON responses omit tokens.
/// </summary>
[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly AuthCookieOptions _authCookieOptions;

    public AuthController(IMediator mediator, AuthCookieOptions authCookieOptions)
    {
        _mediator = mediator;
        _authCookieOptions = authCookieOptions;
    }

    /// <summary>
    /// POST /api/v1/auth/register
    /// Public endpoint — no [Authorize] attribute.
    /// Creates Owner user (unverified). Organization, station, and subscription
    /// are created during onboarding after first login.
    /// </summary>
    /// [AllowAnonymous] tells ASP.NET: "Allow this endpoint to be accessed without authentication."
    /// If the token is missing or invalid, ASP.NET returns 401 automatically.
    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var result = await _mediator.Send(new RegisterCommand(request));

        if (!result.IsSuccess)
            return BadRequest(new { success = false, error = result.Error });

        return Ok(new { success = result.Data!.Success, data = result.Data });
    }


    /// <summary>
    /// POST /api/v1/auth/login
    /// Public endpoint — validates email/password. Sets access_token and refresh_token in HTTP-only cookies.
    /// Returns user, subscription, expiresIn in JSON (no tokens).
    /// </summary>
    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var result = await _mediator.Send(new LoginCommand(request));

        if (!result.IsSuccess)
            return Unauthorized(new { success = false, error = result.Error });

        var data = result.Data!;
        SetAuthCookiesInResponse(data.AccessToken, data.RefreshToken);

        return Ok(new { success = true, data = new { data.User, data.Organization, data.Stations, data.Subscription } });
    }

    /// <summary>
    /// GET /api/v1/auth/me
    /// Protected endpoint — requires a valid JWT token.
    /// Returns the current user's profile.
    /// 
    /// [Authorize] tells ASP.NET: "Only allow this if the request has a valid JWT."
    /// If the token is missing or invalid, ASP.NET returns 401 automatically.
    /// </summary>
    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized(new { success = false, error = "Invalid token." });

        var result = await _mediator.Send(new GetCurrentUserQuery(userId));

        if (!result.IsSuccess)
            return NotFound(new { success = false, error = result.Error });

        var data = result.Data!;
        return Ok(new { success = true, data = new { data.User, data.Organization, data.Stations, data.Subscription } });
    }


    /// <summary>
    /// POST /api/v1/auth/refreshToken
    /// Public endpoint — exchanges a valid refresh token for new access + refresh tokens.
    /// Reads refresh token from cookie. Sets new cookies on success.
    /// </summary>
    [AllowAnonymous]
    [HttpPost("refreshToken")]
    public async Task<IActionResult> RefreshToken()
    {

        var (_, refreshToken) = GetAuthCookiesFromRequest();
        //if refresh token is empty, return unauthorized
        if (string.IsNullOrEmpty(refreshToken))
            return Unauthorized(new { success = false, error = "Refresh token is required." });

        var result = await _mediator.Send(new RefreshTokenCommand(new RefreshTokenRequest { RefreshToken = refreshToken }));

        if (!result.IsSuccess)
        {
            //clear auth cookies
            ClearAuthCookies();
            return Unauthorized(new { success = false, error = result.Error });
        }

        var data = result.Data!;
        //set new auth cookies in response
        SetAuthCookiesInResponse(data.AccessToken, data.RefreshToken);

        return Ok(new { success = true, data = new { data.ExpiresIn, data.User, data.Subscription } });
    }

    /// <summary>
    /// POST /api/v1/auth/verify-email
    /// Public endpoint — verifies email using token from verification link.
    /// </summary>
    [AllowAnonymous]
    [HttpPost("verify-email")]
    public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailRequest request)
    {
        var result = await _mediator.Send(new VerifyEmailCommand(request));

        if (!result.IsSuccess)
            return BadRequest(new { success = false, error = result.Error });

        return Ok(new { success = true, data = result.Data });
    }

    /// <summary>
    /// POST /api/v1/auth/resend-verification
    /// Public endpoint — resends verification email. Returns generic message for security.
    /// </summary>
    [AllowAnonymous]
    [HttpPost("resend-verification")]
    public async Task<IActionResult> ResendVerification([FromBody] ResendVerificationRequest request)
    {
        var result = await _mediator.Send(new ResendVerificationCommand(request));

        if (!result.IsSuccess)
            return BadRequest(new { success = false, error = result.Error });

        return Ok(new { success = true, data = result.Data });
    }

    /// <summary>
    /// POST /api/v1/auth/forgot-password
    /// Public endpoint — sends password reset email. Returns generic message for security.
    /// </summary>
    [AllowAnonymous]
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        var result = await _mediator.Send(new ForgotPasswordCommand(request));

        if (!result.IsSuccess)
            return BadRequest(new { success = false, error = result.Error });

        return Ok(new { success = true, data = result.Data });
    }

    /// <summary>
    /// POST /api/v1/auth/reset-password
    /// Public endpoint — resets password using token from reset link.
    /// </summary>
    [AllowAnonymous]
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        var result = await _mediator.Send(new ResetPasswordCommand(request));

        if (!result.IsSuccess)
            return BadRequest(new { success = false, error = result.Error });

        return Ok(new { success = true, data = result.Data });
    }

    /// <summary>
    /// POST /api/v1/auth/logout
    /// Public endpoint — revokes the refresh token (from cookie or body). Clears auth cookies.
    /// </summary>
    [AllowAnonymous]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] LogoutRequest? request = null)
    {
        var refreshToken = request?.RefreshToken?.Trim() ?? Request.Cookies[CookieConstants.RefreshToken];
        var requestToSend = new LogoutRequest { RefreshToken = refreshToken ?? string.Empty };

        var result = await _mediator.Send(new LogoutCommand(requestToSend));

        //clear auth cookies
        ClearAuthCookies();

        if (!result.IsSuccess)
            return BadRequest(new { success = false, error = result.Error });

        return Ok(new { success = true, data = result.Data });
    }


    /// <summary>
    /// Gets the auth cookies from the request.
    /// </summary>
    private (string accessToken, string refreshToken) GetAuthCookiesFromRequest()
    {
        return (
            Request.Cookies[CookieConstants.AccessToken] ?? string.Empty,
            Request.Cookies[CookieConstants.RefreshToken] ?? string.Empty);
    }

    /// <summary>
    /// Sets the auth cookies in the response.
    /// </summary>
    private void SetAuthCookiesInResponse(string accessToken, string refreshToken)
    {
        Response.Cookies.Append(CookieConstants.AccessToken, accessToken, _authCookieOptions.GetAccessTokenOptions());
        Response.Cookies.Append(CookieConstants.RefreshToken, refreshToken, _authCookieOptions.GetRefreshTokenOptions());
    }
    /// <summary>
    /// Clears the auth cookies.
    /// </summary>
    private void ClearAuthCookies()
    {
        Response.Cookies.Delete(CookieConstants.AccessToken, new CookieOptions { Path = "/" });
        Response.Cookies.Delete(CookieConstants.RefreshToken, new CookieOptions { Path = "/" });
    }
}
