using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.FinancialEntry;
using MediatR;

namespace FuelFlow.Application.Features.FinancialEntry.Queries;

public record GetFinancialEntriesQuery(
    Guid? StationId = null,
    DateTime? DateFrom = null,
    DateTime? DateTo = null,
    string? EntryType = null,
    string? PaymentMethod = null,
    Guid? AccountHeadId = null,
    Guid? BankAccountId = null,
    int Page = 1,
    int PageSize = 20,
    string SortBy = "date",
    string SortOrder = "desc")
    : IRequest<Result<FinancialEntryListResponse>>;
