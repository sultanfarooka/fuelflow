namespace FuelFlow.Application.DTOs.FinancialEntry;

public class AdjustFinancialEntryRequest
{
    public string Reason { get; set; } = string.Empty;
    public decimal CorrectedAmount { get; set; }
    public string? CorrectedEntryType { get; set; }
    public Guid? CorrectedAccountHeadId { get; set; }
    public string? CorrectedPaymentMethod { get; set; }
    public string? CorrectedDescription { get; set; }
}
