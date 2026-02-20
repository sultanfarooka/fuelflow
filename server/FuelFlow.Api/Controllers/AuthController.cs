using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FuelFlow.Application.DTOs.Auth;
using FuelFlow.Application.Features.Auth.Commands;
using FuelFlow.Application.Features.Auth.Queries;

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
/// </summary>
[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;

    public AuthController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// POST /api/v1/auth/register
    /// Public endpoint — no [Authorize] attribute.
    /// Creates: Organization + Owner + Station + Trial subscription.
    /// </summary>
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
    /// Public endpoint — validates email/password, returns JWT tokens.
    /// </summary>
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var result = await _mediator.Send(new LoginCommand(request));

        if (!result.IsSuccess)
            return Unauthorized(new { success = false, error = result.Error });

        return Ok(new { success = true, data = result.Data });
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

        return Ok(new { success = true, data = result.Data });
    }


    /// <summary>
    /// POST /api/v1/auth/refresh
    /// Public endpoint — exchanges a valid refresh token for new access + refresh tokens.
    /// Implements rotation: the old refresh token is revoked and replaced.
    /// </summary>
    [HttpPost("refreshToken")]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
    {
        var result = await _mediator.Send(new RefreshTokenCommand(request));

        if (!result.IsSuccess)
            return Unauthorized(new { success = false, error = result.Error });

        return Ok(new { success = true, data = result.Data });
    }

    /// <summary>
    /// POST /api/v1/auth/verify-email
    /// Public endpoint — verifies email using token from verification link.
    /// </summary>
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
    /// Public endpoint — revokes the refresh token. Client should clear tokens regardless.
    /// </summary>
    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] LogoutRequest request)
    {
        var result = await _mediator.Send(new LogoutCommand(request));

        if (!result.IsSuccess)
            return BadRequest(new { success = false, error = result.Error });

        return Ok(new { success = true, data = result.Data });
    }
}
