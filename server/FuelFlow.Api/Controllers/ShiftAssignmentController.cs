using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FuelFlow.Application.DTOs.ShiftAssignment;
using FuelFlow.Application.Features.ShiftAssignment.Commands;
using FuelFlow.Application.Features.ShiftAssignment.Queries;

namespace FuelFlow.Api.Controllers;

[ApiController]
[Route("api/v1/stations/{stationId:guid}/shifts/{shiftId:guid}/assignments")]
[Authorize(Roles = "Owner,Manager")]
public class ShiftAssignmentController : ControllerBase
{
    private readonly IMediator _mediator;

    public ShiftAssignmentController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(Guid stationId, Guid shiftId, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetShiftAssignmentsByShiftQuery(stationId, shiftId), cancellationToken);
        if (!result.IsSuccess)
            return BadRequest(new { success = false, error = result.Error });
        return Ok(new { success = true, data = result.Data });
    }

    [HttpPost]
    public async Task<IActionResult> Create(Guid stationId, Guid shiftId, [FromBody] CreateShiftAssignmentRequest request, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new CreateShiftAssignmentCommand(stationId, shiftId, request), cancellationToken);
        if (!result.IsSuccess)
            return BadRequest(new { success = false, error = result.Error });
        return Ok(new { success = true, data = result.Data });
    }
}
