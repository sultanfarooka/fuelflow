namespace FuelFlow.Application.DTOs.FinancialEntry;

public class FinancialEntryDto
{
    public Guid Id { get; set; }
    public DateTime Date { get; set; }
    public string EntryType { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsSystemGenerated { get; set; }
    public Guid OrganizationId { get; set; }
    public Guid CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; }

    // Denormalized for display
    public Guid? AccountHeadId { get; set; }
    public string? AccountHeadName { get; set; }

    public Guid? StationId { get; set; }
    public Guid? BankAccountId { get; set; }
    public Guid? ShiftId { get; set; }
    public Guid? CustomerId { get; set; }
    public Guid? VehicleId { get; set; }
    public Guid? SupplierId { get; set; }
    public Guid? InvoiceId { get; set; }
    public Guid? EmployeeId { get; set; }
    public Guid? TransactionGroupId { get; set; }
    public string? AdjustmentReason { get; set; }
}
