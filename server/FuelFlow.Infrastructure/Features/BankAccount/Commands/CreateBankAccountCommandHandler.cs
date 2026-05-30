using MediatR;
using Microsoft.Extensions.Logging;
using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.BankAccount;
using FuelFlow.Application.Features.BankAccount.Commands;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Application.Interfaces.Services;
using BankAccountEntity = FuelFlow.Domain.Entities.BankAccount;

namespace FuelFlow.Infrastructure.Features.BankAccount.Commands;

public class CreateBankAccountCommandHandler : IRequestHandler<CreateBankAccountCommand, Result<BankAccountDto>>
{
    private readonly ICurrentUserService _currentUser;
    private readonly IBankAccountRepository _bankAccountRepo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<CreateBankAccountCommandHandler> _logger;

    public CreateBankAccountCommandHandler(
        ICurrentUserService currentUser,
        IBankAccountRepository bankAccountRepo,
        IUnitOfWork unitOfWork,
        ILogger<CreateBankAccountCommandHandler> logger)
    {
        _currentUser = currentUser;
        _bankAccountRepo = bankAccountRepo;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Result<BankAccountDto>> Handle(CreateBankAccountCommand request, CancellationToken ct)
    {
        var orgId = _currentUser.OrganizationId;
        if (orgId == null)
            return Result<BankAccountDto>.Failure("You must belong to an organization.");

        if (request.OrganizationId != orgId)
            return Result<BankAccountDto>.Failure("Organization not found or access denied.");

        var req = request.Request;

        if (req.IsPrimary)
            await _bankAccountRepo.DemotePrimaryAsync(orgId.Value, ct);

        var account = new BankAccountEntity
        {
            OrganizationId = orgId.Value,
            BankName = req.BankName.Trim(),
            AccountNumber = req.AccountNumber.Trim(),
            AccountTitle = req.AccountTitle.Trim(),
            IsPrimary = req.IsPrimary,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        try
        {
            await _bankAccountRepo.AddAsync(account);
            await _unitOfWork.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to save bank account for org {OrganizationId}", orgId);
            return Result<BankAccountDto>.Failure("Failed to save bank account.");
        }

        return Result<BankAccountDto>.Success(ToDto(account));
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
