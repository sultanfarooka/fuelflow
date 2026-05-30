using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FuelFlow.Application.DTOs.Station;
using FuelFlow.Application.Features.Station.Commands;
using FuelFlow.Application.Features.Station.Queries;
using FuelFlow.Application.Features.ShiftConfig.Commands;
using FuelFlow.Application.Features.ShiftConfig.Queries;
using FuelFlow.Application.DTOs.ShiftConfig;

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

    /// <summary>
    /// POST /api/v1/stations/{stationId}/shift-config
    /// Creates or replaces the shift schedule for a station. Owner only.
    /// </summary>
    [HttpPost("{stationId:guid}/shift-config")]
    [Authorize(Roles = "Owner")]
    public async Task<IActionResult> CreateShiftConfig(Guid stationId, [FromBody] CreateShiftConfigRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(new CreateShiftConfigCommand(stationId, request), ct);
        if (!result.IsSuccess)
            return BadRequest(new { success = false, error = result.Error });
        return Ok(new { success = true, data = result.Data });
    }

    /// <summary>
    /// GET /api/v1/stations/{stationId}/shift-config
    /// Returns the current shift configuration for a station, or null if not yet configured.
    /// </summary>
    [HttpGet("{stationId:guid}/shift-config")]
    [Authorize(Roles = "Owner")]
    public async Task<IActionResult> GetShiftConfig(Guid stationId, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetShiftConfigQuery(stationId), ct);
        if (!result.IsSuccess)
            return BadRequest(new { success = false, error = result.Error });
        if (result.Data == null)
            return NotFound(new { success = false, error = "Shift configuration not found." });
        return Ok(new { success = true, data = result.Data });
    }

    /// <summary>
    /// PUT /api/v1/stations/{stationId}/payment-methods
    /// Replaces the accepted payment methods list for a station. Owner only.
    /// </summary>
    [HttpPut("{stationId:guid}/payment-methods")]
    [Authorize(Roles = "Owner")]
    public async Task<IActionResult> UpdatePaymentMethods(Guid stationId, [FromBody] UpdatePaymentMethodsRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(new UpdatePaymentMethodsCommand(stationId, request), ct);
        if (!result.IsSuccess)
            return BadRequest(new { success = false, error = result.Error });
        return Ok(new { success = true, data = result.Data });
    }

    /// <summary>
    /// POST /api/v1/stations/{stationId}/complete-setup
    /// Validates all required setup steps and marks the station as setup-complete.
    /// Returns 400 with unmet conditions if any required step is incomplete.
    /// </summary>
    [HttpPost("{stationId:guid}/complete-setup")]
    [Authorize(Roles = "Owner")]
    public async Task<IActionResult> CompleteSetup(Guid stationId, CancellationToken ct)
    {
        var result = await _mediator.Send(new CompleteStationSetupCommand(stationId), ct);
        if (!result.IsSuccess)
            return BadRequest(new { success = false, error = result.Error });

        if (!result.Data!.Success)
            return BadRequest(new { success = false, unmetConditions = result.Data.UnmetConditions });

        return Ok(new { success = true });
    }
}
