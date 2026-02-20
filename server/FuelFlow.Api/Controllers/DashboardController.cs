using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FuelFlow.Api.Controllers;

/// <summary>
/// Dashboard endpoints — accessible only to Owner and Manager roles.
/// Demonstrates role-based authorization with [Authorize(Roles = "...")].
/// </summary>
[ApiController]
[Route("api/v1/dashboard")]
[Authorize(Roles = "Owner,Manager")]
public class DashboardController : ControllerBase
{
    /// <summary>
    /// GET /api/v1/dashboard/summary
    /// Returns a placeholder summary — only Owner or Manager can access.
    /// Nozzleman, Accountant, Custom roles get 403 Forbidden.
    /// </summary>
    [HttpGet("summary")]
    public IActionResult GetSummary()
    {
        var userName = User.Identity?.Name ?? "User";
        return Ok(new
        {
            success = true,
            data = new
            {
                message = $"Welcome, {userName}. You have Owner/Manager access.",
                timestamp = DateTime.UtcNow,
            },
        });
    }
}
