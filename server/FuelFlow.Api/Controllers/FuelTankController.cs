using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FuelFlow.Application.DTOs.FuelTank;
using FuelFlow.Application.Features.FuelTank.Commands;
using FuelFlow.Application.Features.FuelTank.Queries;

namespace FuelFlow.Api.Controllers;

[ApiController]
[Route("api/v1/stations/{stationId:guid}/fuel-tanks")]
[Authorize(Roles = "Owner,Manager")]
public class FuelTankController : ControllerBase
{
    private readonly IMediator _mediator;

    public FuelTankController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// GET /api/v1/stations/{stationId}/fuel-tanks
    /// Lists all fuel tanks for the station. Station must belong to the current user's organization.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(Guid stationId, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetFuelTanksByStationQuery(stationId), cancellationToken);

        if (!result.IsSuccess)
            return BadRequest(new { success = false, error = result.Error });

        return Ok(new { success = true, data = result.Data });
    }

    /// <summary>
    /// POST /api/v1/stations/{stationId}/fuel-tanks
    /// Creates a new fuel tank for the station. Capacity and FuelTypeId required; Name optional.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create(Guid stationId, [FromBody] CreateFuelTankRequest request, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new CreateFuelTankCommand(stationId, request), cancellationToken);

        if (!result.IsSuccess)
            return BadRequest(new { success = false, error = result.Error });

        return Ok(new { success = true, data = result.Data });
    }

    /// <summary>
    /// PUT /api/v1/stations/{stationId}/fuel-tanks/{tankId}
    /// Updates name, capacity, or fuel type of an existing tank.
    /// </summary>
    [HttpPut("{tankId:guid}")]
    public async Task<IActionResult> Update(Guid stationId, Guid tankId, [FromBody] UpdateFuelTankRequest request, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new UpdateFuelTankCommand(stationId, tankId, request), cancellationToken);

        if (!result.IsSuccess)
            return BadRequest(new { success = false, error = result.Error });

        return Ok(new { success = true, data = result.Data });
    }

    /// <summary>
    /// DELETE /api/v1/stations/{stationId}/fuel-tanks/{tankId}
    /// Deletes a fuel tank from the station.
    /// </summary>
    [HttpDelete("{tankId:guid}")]
    public async Task<IActionResult> Delete(Guid stationId, Guid tankId, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new DeleteFuelTankCommand(stationId, tankId), cancellationToken);

        if (!result.IsSuccess)
            return BadRequest(new { success = false, error = result.Error });

        return Ok(new { success = true });
    }
}
