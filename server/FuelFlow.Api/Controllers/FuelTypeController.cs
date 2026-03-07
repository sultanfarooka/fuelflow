using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FuelFlow.Application.Features.FuelType.Queries;
using FuelFlow.Application.Features.FuelType.Command;
using FuelFlow.Application.DTOs.FuelType;

namespace FuelFlow.Api.Controllers;

[ApiController]
[Route("api/v1/stations/{stationId:guid}/fuel-types")]
[Authorize(Roles = "Owner,Manager")]
public class FuelTypeController : ControllerBase
{
    private readonly IMediator _mediator;

    public FuelTypeController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// GET /api/v1/stations/{stationId}/fuel-types
    /// Returns fuel types available for the station: (1) from the station's OMC (OMCFuelTypes) and (2) custom types created for this station.
    /// Station must belong to the current user's organization. Each item includes Source ("OMC" or "Custom"); only Custom ids can be used for tanks/prices.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(Guid stationId, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetFuelTypesByStationQuery(stationId), cancellationToken);
        if (!result.IsSuccess)
            return BadRequest(new { success = false, error = result.Error });
        return Ok(new { success = true, data = result.Data });
    }

    /// <summary>
    /// POST /api/v1/stations/{stationId}/fuel-types
    /// Creates a custom fuel type for the station (Name, Unit). Station must belong to the current user's organization.
    /// Custom types can be used as FuelTypeId when creating tanks or setting prices.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create(Guid stationId, [FromBody] CreateFuelTypeRequest request, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new CreateFuelTypeCommand(stationId, request), cancellationToken);
        if (!result.IsSuccess)
            return BadRequest(new { success = false, error = result.Error });
        return Ok(new { success = true, data = result.Data });
    }


    /// <summary>
    /// DELETE /api/v1/stations/{stationId}/fuel-types/{fuelTypeId}
    /// Deletes a custom fuel type from the station. Will fail if the fuel type is referenced by tanks or prices.
    /// Station must belong to the current user's organization.
    /// </summary>
    [HttpDelete("{fuelTypeId:guid}")]
    public async Task<IActionResult> Delete(Guid stationId, Guid fuelTypeId, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new DeleteFuelTypeCommand(stationId, fuelTypeId), cancellationToken);
        if (!result.IsSuccess)
            return BadRequest(new { success = false, error = result.Error });
        return Ok(new { success = true });
    }
}
