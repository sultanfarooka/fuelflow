using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FuelFlow.Application.DTOs.FuelPrices;
using FuelFlow.Application.Features.FuelPrices.Commands;
using FuelFlow.Application.Features.FuelPrices.Queries;

namespace FuelFlow.Api.Controllers;

[ApiController]
[Route("api/v1/stations/{stationId:guid}/fuel-prices")]
[Authorize(Roles = "Owner,Manager")]
public class FuelPricesController : ControllerBase
{
    private readonly IMediator _mediator;

    public FuelPricesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(Guid stationId, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetFuelPricesByStationQuery(stationId), cancellationToken);
        if (!result.IsSuccess)
            return BadRequest(new { success = false, error = result.Error });
        return Ok(new { success = true, data = result.Data });
    }

    [HttpPost]
    public async Task<IActionResult> SetPrice(Guid stationId, [FromBody] SetFuelPriceRequest request, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new SetFuelPriceCommand(stationId, request), cancellationToken);
        if (!result.IsSuccess)
            return BadRequest(new { success = false, error = result.Error });
        return Ok(new { success = true, data = result.Data });
    }
}
