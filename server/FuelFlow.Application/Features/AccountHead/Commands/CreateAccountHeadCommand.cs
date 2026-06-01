using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.AccountHead;
using MediatR;

namespace FuelFlow.Application.Features.AccountHead.Commands;

public record CreateAccountHeadCommand(CreateAccountHeadRequest Request)
    : IRequest<Result<AccountHeadDto>>;
