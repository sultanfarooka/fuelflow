using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.AccountHead;
using MediatR;

namespace FuelFlow.Application.Features.AccountHead.Commands;

public record UpdateAccountHeadCommand(Guid Id, UpdateAccountHeadRequest Request)
    : IRequest<Result<AccountHeadDto>>;
