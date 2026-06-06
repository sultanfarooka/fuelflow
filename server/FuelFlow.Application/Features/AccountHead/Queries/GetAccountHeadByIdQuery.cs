using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.AccountHead;
using MediatR;

namespace FuelFlow.Application.Features.AccountHead.Queries;

public record GetAccountHeadByIdQuery(Guid Id) : IRequest<Result<AccountHeadDto>>;
