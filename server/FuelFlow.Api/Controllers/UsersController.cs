using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FuelFlow.Application.DTOs.Users;
using FuelFlow.Application.Features.Users.Commands;
using FuelFlow.Application.Features.Users.Queries;

namespace FuelFlow.Api.Controllers;

/// <summary>
/// User management endpoints (Owner only). Thin dispatcher — see AuthController for the
/// public activation endpoint invited users complete.
///
/// ROUTE: /api/v1/users
/// Owner-only at the class level — Managers cannot reach it, which fences off
/// M01-F05-R03 (Manager-creates-Custom-Users) until that follow-up ships.
/// </summary>
[ApiController]
[Route("api/v1/users")]
[Authorize(Roles = "Owner")]
public class UsersController : ControllerBase
{
    private readonly IMediator _mediator;

    public UsersController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// POST /api/v1/users/managers
    /// Creates a Manager user for the current Owner's organization ([M01-F05-R02]).
    /// </summary>
    [HttpPost("managers")]
    public async Task<IActionResult> CreateManager([FromBody] CreateManagerRequest request)
    {
        var result = await _mediator.Send(new CreateManagerCommand(request));

        if (!result.IsSuccess)
            return BadRequest(new { success = false, error = result.Error });

        return Ok(new { success = true, data = result.Data });
    }

    /// <summary>
    /// GET /api/v1/users/managers
    /// Lists the Manager users in the current Owner's organization ([M01-F05-R02]).
    /// </summary>
    [HttpGet("managers")]
    public async Task<IActionResult> GetManagers(CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetManagersQuery(), cancellationToken);

        if (!result.IsSuccess)
            return BadRequest(new { success = false, error = result.Error });

        return Ok(new { success = true, data = result.Data });
    }
}
