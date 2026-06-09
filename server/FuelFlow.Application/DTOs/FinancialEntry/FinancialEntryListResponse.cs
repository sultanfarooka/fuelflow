namespace FuelFlow.Application.DTOs.FinancialEntry;

public class FinancialEntryListResponse
{
    public List<FinancialEntryDto> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}
