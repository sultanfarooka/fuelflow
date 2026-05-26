using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.BankAccount;
using MediatR;

namespace FuelFlow.Application.Features.BankAccount.Queries;

public record GetBankAccountsQuery(Guid OrganizationId) : IRequest<Result<List<BankAccountDto>>>;
