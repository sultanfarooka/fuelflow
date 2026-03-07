using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FuelFlow.Application.DTOs.OMC;
using FuelFlow.Application.Features.OMC.Commands;
using FuelFlow.Application.Features.OMC.Queries;

namespace FuelFlow.Api.Controllers;

[ApiController]
[Route("api/v1/omcs")]
[Authorize(Roles = "Owner,Manager")]
public class OMCController : ControllerBase
{
    private readonly IMediator _mediator;

    public OMCController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// GET /api/v1/omcs — Get all OMCs.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetOMCsQuery(), cancellationToken);

        if (!result.IsSuccess)
            return BadRequest(new { success = false, error = result.Error });

        return Ok(new { success = true, data = result.Data });
    }

    /// <summary>
    /// POST /api/v1/omcs — Create a new OMC.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateOMCRequest request, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new CreateOMCCommand(request), cancellationToken);

        if (!result.IsSuccess)
            return BadRequest(new { success = false, error = result.Error });

        return Ok(new { success = true, data = result.Data });
    }
}
