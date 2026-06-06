using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.AccountHead;
using FuelFlow.Application.Features.AccountHead.Commands;
using FuelFlow.Application.Features.AccountHead.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FuelFlow.Api.Controllers;

/// <summary>
/// Account head management (M05-F09). Income/expense categories per organization,
/// consumed by daily expenses (M05-F03), other income (M05-F10), and the P&L report.
/// </summary>
[ApiController]
[Route("api/v1/account-heads")]
[Authorize(Roles = "Owner,Manager")]
public class AccountHeadsController : ControllerBase
{
    private readonly IMediator _mediator;

    public AccountHeadsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// GET /api/v1/account-heads?type=Income|Expense
    /// Lists all account heads for the current organization, optionally filtered by type.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? type, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetAccountHeadsQuery(ParseType(type)), ct);
        if (!result.IsSuccess)
            return MapFailure(result.Error);
        return Ok(new { success = true, data = result.Data });
    }

    /// <summary>
    /// GET /api/v1/account-heads/{id}
    /// Returns a single account head by id (scoped to the current organization).
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetAccountHeadByIdQuery(id), ct);
        if (!result.IsSuccess)
            return MapFailure(result.Error);
        return Ok(new { success = true, data = result.Data });
    }

    /// <summary>
    /// POST /api/v1/account-heads
    /// Creates a custom income or expense account head. Duplicate name → 409.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAccountHeadRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(new CreateAccountHeadCommand(request), ct);
        if (!result.IsSuccess)
            return MapFailure(result.Error);
        return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, new { success = true, data = result.Data });
    }

    /// <summary>
    /// PUT /api/v1/account-heads/{id}
    /// Renames an account head and/or updates its description. Duplicate name → 409.
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateAccountHeadRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(new UpdateAccountHeadCommand(id, request), ct);
        if (!result.IsSuccess)
            return MapFailure(result.Error);
        return Ok(new { success = true, data = result.Data });
    }

    /// <summary>
    /// DELETE /api/v1/account-heads/{id}
    /// Soft-deletes (deactivates) an account head. System-managed heads and heads with
    /// existing transactions cannot be deactivated → 400.
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Deactivate(Guid id, CancellationToken ct)
    {
        var result = await _mediator.Send(new DeactivateAccountHeadCommand(id), ct);
        if (!result.IsSuccess)
            return MapFailure(result.Error);
        return Ok(new { success = true });
    }

    private static int? ParseType(string? type) => type?.Trim().ToLowerInvariant() switch
    {
        "income" or "1" => 1,
        "expense" or "2" => 2,
        _ => null,
    };

    /// <summary>
    /// Maps a <see cref="Result{T}"/> failure message to the right HTTP status.
    /// The Result pattern carries only a string, so the controller classifies by message:
    /// "not found" → 404, "already exists" → 409 (M05-F09-R01 uniqueness), everything else → 400.
    /// </summary>
    private IActionResult MapFailure(string? error)
    {
        var body = new { success = false, error };
        if (error is not null && error.Contains("not found", StringComparison.OrdinalIgnoreCase))
            return NotFound(body);
        if (error is not null && error.Contains("already exists", StringComparison.OrdinalIgnoreCase))
            return Conflict(body);
        return BadRequest(body);
    }
}
