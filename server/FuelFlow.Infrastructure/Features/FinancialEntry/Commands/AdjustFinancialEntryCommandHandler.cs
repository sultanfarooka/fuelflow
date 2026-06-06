using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.FinancialEntry;
using FuelFlow.Application.Features.FinancialEntry.Commands;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Application.Interfaces.Services;
using FuelFlow.Domain.Enums;
using MediatR;

namespace FuelFlow.Infrastructure.Features.FinancialEntry.Commands;

public class AdjustFinancialEntryCommandHandler
    : IRequestHandler<AdjustFinancialEntryCommand, Result<List<FinancialEntryDto>>>
{
    private readonly IFinancialEntryRepository _repo;
    private readonly ICurrentUserService _currentUser;
    private readonly IUnitOfWork _unitOfWork;

    public AdjustFinancialEntryCommandHandler(
        IFinancialEntryRepository repo,
        ICurrentUserService currentUser,
        IUnitOfWork unitOfWork)
    {
        _repo = repo;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<List<FinancialEntryDto>>> Handle(
        AdjustFinancialEntryCommand request, CancellationToken ct)
    {
        var orgId = _currentUser.OrganizationId;
        if (orgId == null)
            return Result<List<FinancialEntryDto>>.Failure("You must belong to an organization.");

        var userId = _currentUser.UserId;
        if (userId == null)
            return Result<List<FinancialEntryDto>>.Failure("User identity not available.");

        var original = await _repo.GetByIdAsync(request.EntryId, orgId.Value, ct);
        if (original == null)
            return Result<List<FinancialEntryDto>>.Failure("Financial entry not found.");

        if (original.IsSystemGenerated)
            return Result<List<FinancialEntryDto>>.Failure("System-generated entries cannot be adjusted.");

        var groupId = Guid.NewGuid();
        var now = DateTime.UtcNow;

        // 1. Reversal row — negates the original amount
        var reversal = new Domain.Entities.FinancialEntry
        {
            Date = original.Date,
            EntryType = FinancialEntryType.ManualAdjustment,
            Amount = -original.Amount,
            PaymentMethod = original.PaymentMethod,
            IsSystemGenerated = true,
            Description = original.Description,
            CreatedByUserId = userId.Value,
            OrganizationId = orgId.Value,
            AccountHeadId = original.AccountHeadId,
            StationId = original.StationId,
            BankAccountId = original.BankAccountId,
            ShiftId = original.ShiftId,
            CustomerId = original.CustomerId,
            VehicleId = original.VehicleId,
            SupplierId = original.SupplierId,
            InvoiceId = original.InvoiceId,
            EmployeeId = original.EmployeeId,
            TransactionGroupId = groupId,
            AdjustmentReason = request.Request.Reason,
            CreatedAt = now,
            UpdatedAt = now,
        };

        // 2. Correction row — applies corrected values where provided
        var correctedEntryType = FinancialEntryType.ManualAdjustment;
        if (!string.IsNullOrWhiteSpace(request.Request.CorrectedEntryType)
            && Enum.TryParse<FinancialEntryType>(request.Request.CorrectedEntryType, true, out var parsedType))
        {
            correctedEntryType = parsedType;
        }

        var correctedPaymentMethod = original.PaymentMethod;
        if (!string.IsNullOrWhiteSpace(request.Request.CorrectedPaymentMethod)
            && Enum.TryParse<PaymentMethod>(request.Request.CorrectedPaymentMethod, true, out var parsedMethod))
        {
            correctedPaymentMethod = parsedMethod;
        }

        var correction = new Domain.Entities.FinancialEntry
        {
            Date = original.Date,
            EntryType = correctedEntryType,
            Amount = request.Request.CorrectedAmount,
            PaymentMethod = correctedPaymentMethod,
            IsSystemGenerated = false,
            Description = request.Request.CorrectedDescription ?? original.Description,
            CreatedByUserId = userId.Value,
            OrganizationId = orgId.Value,
            AccountHeadId = request.Request.CorrectedAccountHeadId ?? original.AccountHeadId,
            StationId = original.StationId,
            BankAccountId = original.BankAccountId,
            ShiftId = original.ShiftId,
            CustomerId = original.CustomerId,
            VehicleId = original.VehicleId,
            SupplierId = original.SupplierId,
            InvoiceId = original.InvoiceId,
            EmployeeId = original.EmployeeId,
            TransactionGroupId = groupId,
            AdjustmentReason = request.Request.Reason,
            CreatedAt = now,
            UpdatedAt = now,
        };

        await _repo.AddRangeAsync([reversal, correction], ct);
        await _unitOfWork.SaveChangesAsync();

        return Result<List<FinancialEntryDto>>.Success(
        [
            Queries.GetFinancialEntriesQueryHandler.ToDto(reversal),
            Queries.GetFinancialEntriesQueryHandler.ToDto(correction),
        ]);
    }
}
