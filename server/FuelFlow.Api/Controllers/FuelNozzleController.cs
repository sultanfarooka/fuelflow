using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FuelFlow.Application.DTOs.FuelNozzle;
using FuelFlow.Application.Features.FuelNozzle.Commands;
using FuelFlow.Application.Features.FuelNozzle.Queries;

namespace FuelFlow.Api.Controllers;

[ApiController]
[Route("api/v1/stations/{stationId:guid}/fuel-nozzles")]
[Authorize(Roles = "Owner,Manager")]
public class FuelNozzleController : ControllerBase
{
    private readonly IMediator _mediator;

    public FuelNozzleController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(Guid stationId, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetFuelNozzlesByStationQuery(stationId), cancellationToken);
        if (!result.IsSuccess)
            return BadRequest(new { success = false, error = result.Error });
        return Ok(new { success = true, data = result.Data });
    }

    [HttpPost]
    public async Task<IActionResult> Create(Guid stationId, [FromBody] CreateFuelNozzleRequest request, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new CreateFuelNozzleCommand(stationId, request), cancellationToken);
        if (!result.IsSuccess)
            return BadRequest(new { success = false, error = result.Error });
        return Ok(new { success = true, data = result.Data });
    }

    /// <summary>
    /// DELETE /api/v1/stations/{stationId}/fuel-nozzles/{nozzleId}
    /// Deletes a fuel nozzle from the station.
    /// </summary>
    [HttpDelete("{nozzleId:guid}")]
    public async Task<IActionResult> Delete(Guid stationId, Guid nozzleId, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new DeleteFuelNozzleCommand(stationId, nozzleId), cancellationToken);
        if (!result.IsSuccess)
            return BadRequest(new { success = false, error = result.Error });
        return Ok(new { success = true });
    }
}
