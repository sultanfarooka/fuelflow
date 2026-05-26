using MediatR;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.BankAccount;
using FuelFlow.Application.Features.BankAccount.Queries;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Application.Interfaces.Services;
using BankAccountEntity = FuelFlow.Domain.Entities.BankAccount;

namespace FuelFlow.Infrastructure.Features.BankAccount.Queries;

public class GetBankAccountsQueryHandler : IRequestHandler<GetBankAccountsQuery, Result<List<BankAccountDto>>>
{
    private readonly ICurrentUserService _currentUser;
    private readonly IBankAccountRepository _bankAccountRepo;

    public GetBankAccountsQueryHandler(
        ICurrentUserService currentUser,
        IBankAccountRepository bankAccountRepo)
    {
        _currentUser = currentUser;
        _bankAccountRepo = bankAccountRepo;
    }

    public async Task<Result<List<BankAccountDto>>> Handle(GetBankAccountsQuery request, CancellationToken ct)
    {
        var orgId = _currentUser.OrganizationId;
        if (orgId == null)
            return Result<List<BankAccountDto>>.Failure("You must belong to an organization.");

        if (request.OrganizationId != orgId)
            return Result<List<BankAccountDto>>.Failure("Organization not found or access denied.");

        var accounts = await _bankAccountRepo.GetByOrganizationIdAsync(orgId.Value, ct);

        var dtos = accounts.Select(ToDto).ToList();
        return Result<List<BankAccountDto>>.Success(dtos);
    }

    private static BankAccountDto ToDto(BankAccountEntity a) => new()
    {
        Id = a.Id,
        OrganizationId = a.OrganizationId,
        BankName = a.BankName,
        AccountNumber = a.AccountNumber,
        AccountTitle = a.AccountTitle,
        IsPrimary = a.IsPrimary,
    };
}
