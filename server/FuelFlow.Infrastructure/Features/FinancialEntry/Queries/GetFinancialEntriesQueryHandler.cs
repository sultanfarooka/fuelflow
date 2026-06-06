using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.FinancialEntry;
using FuelFlow.Application.Features.FinancialEntry.Queries;
using FuelFlow.Application.Interfaces.Repositories;
using FuelFlow.Application.Interfaces.Services;
using MediatR;

namespace FuelFlow.Infrastructure.Features.FinancialEntry.Queries;

public class GetFinancialEntriesQueryHandler
    : IRequestHandler<GetFinancialEntriesQuery, Result<FinancialEntryListResponse>>
{
    private readonly IFinancialEntryRepository _repo;
    private readonly ICurrentUserService _currentUser;

    public GetFinancialEntriesQueryHandler(IFinancialEntryRepository repo, ICurrentUserService currentUser)
    {
        _repo = repo;
        _currentUser = currentUser;
    }

    public async Task<Result<FinancialEntryListResponse>> Handle(
        GetFinancialEntriesQuery request, CancellationToken ct)
    {
        var orgId = _currentUser.OrganizationId;
        if (orgId == null)
            return Result<FinancialEntryListResponse>.Failure("You must belong to an organization.");

        var (items, totalCount) = await _repo.GetListAsync(
            orgId.Value,
            request.StationId,
            request.DateFrom,
            request.DateTo,
            request.EntryType,
            request.PaymentMethod,
            request.AccountHeadId,
            request.BankAccountId,
            request.Page,
            request.PageSize,
            request.SortBy,
            request.SortOrder,
            ct);

        var response = new FinancialEntryListResponse
        {
            Items = items.Select(ToDto).ToList(),
            TotalCount = totalCount,
            Page = request.Page,
            PageSize = request.PageSize,
        };

        return Result<FinancialEntryListResponse>.Success(response);
    }

    internal static FinancialEntryDto ToDto(Domain.Entities.FinancialEntry e) => new()
    {
        Id = e.Id,
        Date = e.Date,
        EntryType = e.EntryType.ToString(),
        Amount = e.Amount,
        PaymentMethod = e.PaymentMethod.ToString(),
        Description = e.Description,
        IsSystemGenerated = e.IsSystemGenerated,
        OrganizationId = e.OrganizationId,
        CreatedByUserId = e.CreatedByUserId,
        CreatedAt = e.CreatedAt,
        AccountHeadId = e.AccountHeadId,
        AccountHeadName = e.AccountHead?.Name,
        StationId = e.StationId,
        BankAccountId = e.BankAccountId,
        ShiftId = e.ShiftId,
        CustomerId = e.CustomerId,
        VehicleId = e.VehicleId,
        SupplierId = e.SupplierId,
        InvoiceId = e.InvoiceId,
        EmployeeId = e.EmployeeId,
        TransactionGroupId = e.TransactionGroupId,
        AdjustmentReason = e.AdjustmentReason,
    };
}
