using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.FinancialEntry;
using FuelFlow.Application.Features.FinancialEntry.Commands;
using FuelFlow.Application.Features.FinancialEntry.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FuelFlow.Api.Controllers;

/// <summary>
/// Financial ledger endpoints (M05-F11). Read-only list/filter and manual
/// adjustment of financial entries. Entries are created by consuming features
/// (M05-F03, M05-F10, M04-F06, etc.) through the repository — no public
/// create endpoint.
/// </summary>
[ApiController]
[Route("api/v1/financial-entries")]
[Authorize(Roles = "Owner,Manager")]
public class FinancialEntriesController : ControllerBase
{
    private readonly IMediator _mediator;

    public FinancialEntriesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// GET /api/v1/financial-entries
    /// Lists financial entries with optional filters, pagination, and sorting.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] Guid? stationId,
        [FromQuery] DateTime? dateFrom,
        [FromQuery] DateTime? dateTo,
        [FromQuery] string? entryType,
        [FromQuery] string? paymentMethod,
        [FromQuery] Guid? accountHeadId,
        [FromQuery] Guid? bankAccountId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string sortBy = "date",
        [FromQuery] string sortOrder = "desc",
        CancellationToken ct = default)
    {
        var query = new GetFinancialEntriesQuery(
            stationId, dateFrom, dateTo, entryType, paymentMethod,
            accountHeadId, bankAccountId, page, pageSize, sortBy, sortOrder);

        var result = await _mediator.Send(query, ct);
        if (!result.IsSuccess)
            return MapFailure(result.Error);

        return Ok(new { success = true, data = result.Data });
    }

    /// <summary>
    /// POST /api/v1/financial-entries/{id}/adjust
    /// Creates a reversal + correction pair for a non-system-generated entry.
    /// </summary>
    [HttpPost("{id:guid}/adjust")]
    public async Task<IActionResult> Adjust(
        Guid id,
        [FromBody] AdjustFinancialEntryRequest request,
        CancellationToken ct)
    {
        var result = await _mediator.Send(new AdjustFinancialEntryCommand(id, request), ct);
        if (!result.IsSuccess)
            return MapFailure(result.Error);

        return Ok(new { success = true, data = result.Data });
    }

    private IActionResult MapFailure(string? error)
    {
        var body = new { success = false, error };
        if (error is not null && error.Contains("not found", StringComparison.OrdinalIgnoreCase))
            return NotFound(body);
        return BadRequest(body);
    }
}
