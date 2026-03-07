using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FuelFlow.Application.DTOs.Onboarding;
using FuelFlow.Application.Features.Onboarding.Commands;
using FuelFlow.Api.Options;

namespace FuelFlow.Api.Controllers;

/// <summary>
/// Onboarding: create organization and first station. Sets user.OrganizationId and returns new JWT with org_id claim via cookies.
/// </summary>
[ApiController]
[Route("api/v1/onboarding")]
[Authorize]
public class OnboardingController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly AuthCookieOptions _authCookieOptions;

    public OnboardingController(IMediator mediator, AuthCookieOptions authCookieOptions)
    {
        _mediator = mediator;
        _authCookieOptions = authCookieOptions;
    }

    /// <summary>
    /// POST /api/v1/onboarding
    /// Creates the user's organization and first station, links org to user. Returns new tokens in cookies and same auth shape as login (expiresIn, user, subscription).
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Onboard([FromBody] OnboardingRequest request)
    {
        var result = await _mediator.Send(new OnboardingCommand(request));

        if (!result.IsSuccess)
            return BadRequest(new { success = false, error = result.Error });

        var data = result.Data!;
        SetAuthCookiesInResponse(data.AccessToken, data.RefreshToken);

        // Return same shape as login/me so frontend auth store receives org + stations
        return Ok(new
        {
            success = true,
            data = new
            {
                data.User,
                data.Organization,
                data.Stations,
                data.Subscription,
            }
        });
    }

    private void SetAuthCookiesInResponse(string accessToken, string refreshToken)
    {
        Response.Cookies.Append(CookieConstants.AccessToken, accessToken, _authCookieOptions.GetAccessTokenOptions());
        Response.Cookies.Append(CookieConstants.RefreshToken, refreshToken, _authCookieOptions.GetRefreshTokenOptions());
    }
}
