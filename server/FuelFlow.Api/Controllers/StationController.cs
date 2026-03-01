using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FuelFlow.Application.DTOs.Station;
using FuelFlow.Application.Features.Station.Commands;

namespace FuelFlow.Api.Controllers;

[ApiController]
[Route("api/v1/stations")]
[Authorize(Roles = "Owner,Manager")]
public class StationController : ControllerBase
{
    private readonly IMediator _mediator;

    public StationController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// POST /api/v1/stations
    /// Creates a new station for the current user's organization. Owner only; enforces plan station limit.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateStationRequest request)
    {
        var result = await _mediator.Send(new CreateStationCommand(request));

        if (!result.IsSuccess)
            return BadRequest(new { success = false, error = result.Error });

        return Ok(new { success = true, data = result.Data });
    }
}
