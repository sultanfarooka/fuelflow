using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.BankAccount;
using MediatR;

namespace FuelFlow.Application.Features.BankAccount.Commands;

public record CreateBankAccountCommand(Guid OrganizationId, CreateBankAccountRequest Request)
    : IRequest<Result<BankAccountDto>>;
