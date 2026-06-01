using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.AccountHead;
using MediatR;

namespace FuelFlow.Application.Features.AccountHead.Queries;

/// <param name="Type">Optional filter: 1 = Income, 2 = Expense. Null returns all.</param>
public record GetAccountHeadsQuery(int? Type = null)
    : IRequest<Result<List<AccountHeadDto>>>;
