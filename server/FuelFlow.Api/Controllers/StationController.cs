using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FuelFlow.Application.DTOs.Station;
using FuelFlow.Application.Features.Station.Commands;
using FuelFlow.Application.Features.Station.Queries;

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

        return Ok(new { success = true, message = "Station created successfully", data = result.Data });
    }

    /// <summary>
    /// GET /api/v1/stations/{organizationId:guid}
    /// Returns all active stations for the given organization. Caller must belong to that organization (Owner or Manager).
    /// </summary>
    [HttpGet("{organizationId:guid}")]
    public async Task<IActionResult> GetAllByOrganization(Guid organizationId, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetStationsByOrganizationQuery(organizationId), cancellationToken);
        if (!result.IsSuccess)
            return BadRequest(new { success = false, error = result.Error });
        return Ok(new { success = true, data = result.Data });
    }
}
