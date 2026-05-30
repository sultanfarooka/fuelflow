using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FuelFlow.Application.DTOs.BankAccount;
using FuelFlow.Application.Features.BankAccount.Commands;
using FuelFlow.Application.Features.BankAccount.Queries;

namespace FuelFlow.Api.Controllers;

[ApiController]
[Route("api/v1/organizations")]
[Authorize(Roles = "Owner")]
public class OrganizationsController : ControllerBase
{
    private readonly IMediator _mediator;

    public OrganizationsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// POST /api/v1/organizations/{orgId}/bank-accounts
    /// Adds a bank account to the organization. Owner only.
    /// </summary>
    [HttpPost("{orgId:guid}/bank-accounts")]
    public async Task<IActionResult> CreateBankAccount(Guid orgId, [FromBody] CreateBankAccountRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(new CreateBankAccountCommand(orgId, request), ct);
        if (!result.IsSuccess)
            return BadRequest(new { success = false, error = result.Error });
        return CreatedAtAction(nameof(GetBankAccounts), new { orgId }, new { success = true, data = result.Data });
    }

    /// <summary>
    /// GET /api/v1/organizations/{orgId}/bank-accounts
    /// Returns all bank accounts for the organization. Owner only.
    /// </summary>
    [HttpGet("{orgId:guid}/bank-accounts")]
    public async Task<IActionResult> GetBankAccounts(Guid orgId, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetBankAccountsQuery(orgId), ct);
        if (!result.IsSuccess)
            return BadRequest(new { success = false, error = result.Error });
        return Ok(new { success = true, data = result.Data });
    }
}
