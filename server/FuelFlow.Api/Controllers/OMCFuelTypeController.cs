using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FuelFlow.Application.DTOs.OMCFuelType;
using FuelFlow.Application.Features.OMCFuelType.Commands;
using FuelFlow.Application.Features.OMCFuelType.Queries;

namespace FuelFlow.Api.Controllers;

[ApiController]
[Route("api/v1/omc-fuel-types")]
[Authorize(Roles = "Owner,Manager")]
public class OMCFuelTypeController : ControllerBase
{
    private readonly IMediator _mediator;

    public OMCFuelTypeController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// GET /api/v1/omc-fuel-types — Get all OMC fuel types. Optional: ?omcId= to filter by OMC.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] Guid? omcId, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetOMCFuelTypesQuery(omcId), cancellationToken);

        if (!result.IsSuccess)
            return BadRequest(new { success = false, error = result.Error });

        return Ok(new { success = true, data = result.Data });
    }

    /// <summary>
    /// POST /api/v1/omc-fuel-types — Create a new OMC fuel type.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateOMCFuelTypeRequest request, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new CreateOMCFuelTypeCommand(request), cancellationToken);

        if (!result.IsSuccess)
            return BadRequest(new { success = false, error = result.Error });

        return Ok(new { success = true, data = result.Data });
    }
}
