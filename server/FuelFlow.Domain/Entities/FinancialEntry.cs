using FuelFlow.Domain.Common;
using FuelFlow.Domain.Enums;
using FuelFlow.Domain.Entities.StationEntities;

namespace FuelFlow.Domain.Entities;

public class FinancialEntry : BaseEntity
{
    // Mandatory columns
    public DateTime Date { get; set; }
    public FinancialEntryType EntryType { get; set; }
    public decimal Amount { get; set; }
    public PaymentMethod PaymentMethod { get; set; }
    public bool IsSystemGenerated { get; set; }
    public string? Description { get; set; }
    public Guid CreatedByUserId { get; set; }

    // Organization (FK with nav — same AppDbContext)
    public Guid OrganizationId { get; set; }
    public Organization Organization { get; set; } = null!;

    // Optional dimension columns (FK with nav — same AppDbContext)
    public Guid? AccountHeadId { get; set; }
    public AccountHead? AccountHead { get; set; }

    public Guid? StationId { get; set; }
    public Station? Station { get; set; }

    public Guid? BankAccountId { get; set; }
    public BankAccount? BankAccount { get; set; }

    public Guid? ShiftId { get; set; }
    public StationShift? StationShift { get; set; }

    // Plain Guid columns (no nav — entities don't exist yet)
    public Guid? CustomerId { get; set; }
    public Guid? VehicleId { get; set; }
    public Guid? SupplierId { get; set; }
    public Guid? InvoiceId { get; set; }
    public Guid? EmployeeId { get; set; }
    public Guid? TransactionGroupId { get; set; }

    // Correction columns
    public string? AdjustmentReason { get; set; }
}
