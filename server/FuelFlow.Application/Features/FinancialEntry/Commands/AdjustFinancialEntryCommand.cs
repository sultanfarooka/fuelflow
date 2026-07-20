using FuelFlow.Application.Common;
using FuelFlow.Application.DTOs.FinancialEntry;
using MediatR;

namespace FuelFlow.Application.Features.FinancialEntry.Commands;

public record AdjustFinancialEntryCommand(Guid EntryId, AdjustFinancialEntryRequest Request)
    : IRequest<Result<List<FinancialEntryDto>>>;
