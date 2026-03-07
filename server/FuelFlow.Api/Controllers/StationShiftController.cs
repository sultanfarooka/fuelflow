using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FuelFlow.Application.DTOs.StationShift;
using FuelFlow.Application.Features.StationShift.Commands;
using FuelFlow.Application.Features.StationShift.Queries;

namespace FuelFlow.Api.Controllers;

[ApiController]
[Route("api/v1/stations/{stationId:guid}/shifts")]
[Authorize(Roles = "Owner,Manager,Nozzleman")]
public class StationShiftController : ControllerBase
{
    private readonly IMediator _mediator;

    public StationShiftController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(Guid stationId, [FromQuery] int limit = 50, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new GetStationShiftsByStationQuery(stationId, limit), cancellationToken);
        if (!result.IsSuccess)
            return BadRequest(new { success = false, error = result.Error });
        return Ok(new { success = true, data = result.Data });
    }

    [HttpGet("open")]
    public async Task<IActionResult> GetOpen(Guid stationId, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetOpenShiftQuery(stationId), cancellationToken);
        if (!result.IsSuccess)
            return BadRequest(new { success = false, error = result.Error });
        return Ok(new { success = true, data = result.Data });
    }

    [HttpPost("open")]
    public async Task<IActionResult> Open(Guid stationId, [FromBody] OpenShiftRequest request, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new OpenShiftCommand(stationId, request), cancellationToken);
        if (!result.IsSuccess)
            return BadRequest(new { success = false, error = result.Error });
        return Ok(new { success = true, data = result.Data });
    }

    [HttpPost("{shiftId:guid}/close")]
    public async Task<IActionResult> Close(Guid stationId, Guid shiftId, [FromBody] CloseShiftRequest request, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new CloseShiftCommand(stationId, shiftId, request), cancellationToken);
        if (!result.IsSuccess)
            return BadRequest(new { success = false, error = result.Error });
        return Ok(new { success = true, data = result.Data });
    }
}
