using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FuelFlow.Application.DTOs.DipChart;
using FuelFlow.Application.Features.DipChart.Commands;
using FuelFlow.Application.Features.DipChart.Queries;

namespace FuelFlow.Api.Controllers;

[ApiController]
[Route("api/v1/stations/{stationId:guid}/fuel-tanks/{tankId:guid}/dip-chart")]
[Authorize(Roles = "Owner,Manager")]
public class DipChartController : ControllerBase
{
    private readonly IMediator _mediator;

    public DipChartController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// GET /api/v1/stations/{stationId}/fuel-tanks/{tankId}/dip-chart
    /// Gets the dip chart for the fuel tank. Returns null if none configured.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetByTank(Guid stationId, Guid tankId, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetDipChartByTankQuery(stationId, tankId), cancellationToken);

        if (!result.IsSuccess)
            return BadRequest(new { success = false, error = result.Error });

        return Ok(new { success = true, data = result.Data });
    }

    /// <summary>
    /// POST /api/v1/stations/{stationId}/fuel-tanks/{tankId}/dip-chart
    /// Uploads or replaces the dip chart for the fuel tank.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Upload(Guid stationId, Guid tankId, [FromBody] UploadDipChartRequest request, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new UploadDipChartCommand(stationId, tankId, request), cancellationToken);

        if (!result.IsSuccess)
            return BadRequest(new { success = false, error = result.Error });

        return Ok(new { success = true, data = result.Data });
    }
}
