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

    /// <summary>
    /// GET /api/v1/stations/{stationId}/fuel-nozzles
    /// Lists all nozzles for the station (with ShiftAssignmentCount per M08-F03).
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(Guid stationId, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetFuelNozzlesByStationQuery(stationId), cancellationToken);
        if (!result.IsSuccess)
            return BadRequest(new { success = false, error = result.Error });
        return Ok(new { success = true, data = result.Data });
    }

    /// <summary>
    /// POST /api/v1/stations/{stationId}/fuel-nozzles
    /// Creates a nozzle on a tank at this station.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create(Guid stationId, [FromBody] CreateFuelNozzleRequest request, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new CreateFuelNozzleCommand(stationId, request), cancellationToken);
        if (!result.IsSuccess)
            return BadRequest(new { success = false, error = result.Error });
        return Ok(new { success = true, data = result.Data });
    }

    /// <summary>
    /// PUT /api/v1/stations/{stationId}/fuel-nozzles/{nozzleId}
    /// [M08-F03] Updates a nozzle's number and/or tank assignment. Does NOT
    /// touch IsActive — use PATCH .../status for that.
    /// </summary>
    [HttpPut("{nozzleId:guid}")]
    public async Task<IActionResult> Update(Guid stationId, Guid nozzleId, [FromBody] UpdateFuelNozzleRequest request, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new UpdateFuelNozzleCommand(stationId, nozzleId, request), cancellationToken);
        if (!result.IsSuccess)
            return BadRequest(new { success = false, error = result.Error });
        return Ok(new { success = true, data = result.Data });
    }

    /// <summary>
    /// PATCH /api/v1/stations/{stationId}/fuel-nozzles/{nozzleId}/status
    /// [M08-F03] Activates or deactivates a nozzle. Soft-deactivate is not
    /// blocked by shift assignments — the toggle is the "nozzle under
    /// maintenance" state.
    /// </summary>
    [HttpPatch("{nozzleId:guid}/status")]
    public async Task<IActionResult> SetActive(Guid stationId, Guid nozzleId, [FromBody] SetFuelNozzleActiveRequest request, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new SetFuelNozzleActiveCommand(stationId, nozzleId, request), cancellationToken);
        if (!result.IsSuccess)
            return BadRequest(new { success = false, error = result.Error });
        return Ok(new { success = true, data = result.Data });
    }

    /// <summary>
    /// DELETE /api/v1/stations/{stationId}/fuel-nozzles/{nozzleId}
    /// [M08-F03] Deletes a nozzle. Blocked (409) when any ShiftAssignments
    /// reference it. Station must belong to the current user's organization.
    /// </summary>
    [HttpDelete("{nozzleId:guid}")]
    public async Task<IActionResult> Delete(Guid stationId, Guid nozzleId, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new DeleteFuelNozzleCommand(stationId, nozzleId), cancellationToken);

        if (!result.IsSuccess)
            return BadRequest(new { success = false, error = result.Error });

        if (result.Data!.Blocked)
            return Conflict(new
            {
                success = false,
                error = $"Cannot delete: in use by {string.Join(" and ", result.Data.BlockingReferences)}.",
                references = result.Data.BlockingReferences,
            });

        return Ok(new { success = true, data = result.Data });
    }
}
