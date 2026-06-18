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
    /// PUT /api/v1/stations/{stationId}/fuel-types/{fuelTypeId}
    /// [M08-F08-R03] Renames a fuel type's display name for the station (OMC-derived or custom).
    /// Rejects per-station duplicate names. Station must belong to the current user's organization.
    /// </summary>
    [HttpPut("{fuelTypeId:guid}")]
    public async Task<IActionResult> Rename(Guid stationId, Guid fuelTypeId, [FromBody] RenameFuelTypeRequest request, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new RenameFuelTypeCommand(stationId, fuelTypeId, request), cancellationToken);
        if (!result.IsSuccess)
            return BadRequest(new { success = false, error = result.Error });
        return Ok(new { success = true });
    }

    /// <summary>
    /// PATCH /api/v1/stations/{stationId}/fuel-types/{fuelTypeId}/status
    /// [M08-F08-R04/R05] Activates or deactivates a fuel type for the station. Deactivation is
    /// blocked (409) while the type is referenced by a tank or an active price. Station must belong
    /// to the current user's organization.
    /// </summary>
    [HttpPatch("{fuelTypeId:guid}/status")]
    public async Task<IActionResult> SetActive(Guid stationId, Guid fuelTypeId, [FromBody] SetFuelTypeActiveRequest request, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new SetFuelTypeActiveCommand(stationId, fuelTypeId, request), cancellationToken);
        if (!result.IsSuccess)
            return BadRequest(new { success = false, error = result.Error });
        if (result.Data!.Blocked)
            return Conflict(new
            {
                success = false,
                error = $"Cannot deactivate: in use by {string.Join(" and ", result.Data.BlockingReferences)}.",
                references = result.Data.BlockingReferences,
            });
        return Ok(new { success = true, data = result.Data });
    }

    /// <summary>
    /// DELETE /api/v1/stations/{stationId}/fuel-types/{fuelTypeId}
    /// Deletes a custom fuel type from the station. Will fail if the fuel type is referenced by tanks or prices.
    /// Station must belong to the current user's organization.
    /// Note: the management surface (M08-F08) uses PATCH .../status to deactivate; this hard DELETE
    /// is retained for the onboarding wizard's "remove a just-added fuel" flow (M12-F01).
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
