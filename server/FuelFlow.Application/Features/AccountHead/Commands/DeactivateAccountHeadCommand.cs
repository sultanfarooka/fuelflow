using FuelFlow.Application.Common;
using MediatR;

namespace FuelFlow.Application.Features.AccountHead.Commands;

public record DeactivateAccountHeadCommand(Guid Id) : IRequest<Result<bool>>;
