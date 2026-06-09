using FuelFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FuelFlow.Infrastructure.Data.Configurations.PerTenant;

/// <summary>
/// EF Core config for FinancialEntry (M05-F11).
/// Single unified ledger table that every financial event writes to.
/// Scoped to Organization; entries are immutable (corrections via ManualAdjustment pairs).
/// </summary>
public class FinancialEntryConfiguration : IEntityTypeConfiguration<FinancialEntry>
{
    public void Configure(EntityTypeBuilder<FinancialEntry> builder)
    {
        // 1. Table & key
        builder.ToTable("financial_entries");

        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id)
            .HasColumnName("id")
            .HasDefaultValueSql("gen_random_uuid()");

        // 2. Non-FK properties
        builder.Property(e => e.Date)
            .HasColumnName("date")
            .IsRequired();

        builder.Property(e => e.EntryType)
            .HasColumnName("entry_type")
            .HasConversion<string>()
            .IsRequired();

        builder.Property(e => e.Amount)
            .HasColumnName("amount")
            .HasPrecision(18, 4)
            .IsRequired();

        builder.Property(e => e.PaymentMethod)
            .HasColumnName("payment_method")
            .HasConversion<string>()
            .IsRequired();

        builder.Property(e => e.IsSystemGenerated)
            .HasColumnName("is_system_generated")
            .HasDefaultValue(false)
            .IsRequired();

        builder.Property(e => e.Description)
            .HasColumnName("description")
            .HasMaxLength(500);

        builder.Property(e => e.AdjustmentReason)
            .HasColumnName("adjustment_reason")
            .HasMaxLength(500);

        builder.Property(e => e.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("NOW()");

        builder.Property(e => e.UpdatedAt)
            .HasColumnName("updated_at")
            .HasDefaultValueSql("NOW()");

        // 3. Relationships

        // Plain Guid: CreatedByUserId (cross-context — user is in ControlPlane)
        builder.Property(e => e.CreatedByUserId)
            .HasColumnName("created_by_user_id")
            .IsRequired();

        // Relationship: FinancialEntry -> Organization (many-to-one)
        // On delete restrict: don't cascade-delete entries when org is deleted
        builder.Property(e => e.OrganizationId)
            .HasColumnName("organization_id")
            .IsRequired();
        builder.HasOne(e => e.Organization)
            .WithMany()
            .HasForeignKey(e => e.OrganizationId)
            .OnDelete(DeleteBehavior.Restrict);

        // Relationship: FinancialEntry -> AccountHead (many-to-one, optional)
        // On delete set null: if account head is removed, entries keep existing but lose the FK
        builder.Property(e => e.AccountHeadId)
            .HasColumnName("account_head_id");
        builder.HasOne(e => e.AccountHead)
            .WithMany()
            .HasForeignKey(e => e.AccountHeadId)
            .OnDelete(DeleteBehavior.SetNull);

        // Relationship: FinancialEntry -> Station (many-to-one, optional)
        // On delete restrict: don't cascade-delete entries when station is deleted
        builder.Property(e => e.StationId)
            .HasColumnName("station_id");
        builder.HasOne(e => e.Station)
            .WithMany()
            .HasForeignKey(e => e.StationId)
            .OnDelete(DeleteBehavior.Restrict);

        // Relationship: FinancialEntry -> BankAccount (many-to-one, optional)
        // On delete restrict: don't cascade-delete entries when bank account is deleted
        builder.Property(e => e.BankAccountId)
            .HasColumnName("bank_account_id");
        builder.HasOne(e => e.BankAccount)
            .WithMany()
            .HasForeignKey(e => e.BankAccountId)
            .OnDelete(DeleteBehavior.Restrict);

        // Relationship: FinancialEntry -> StationShift (many-to-one, optional)
        // On delete set null: if shift record is purged, entries keep existing
        builder.Property(e => e.ShiftId)
            .HasColumnName("shift_id");
        builder.HasOne(e => e.StationShift)
            .WithMany()
            .HasForeignKey(e => e.ShiftId)
            .OnDelete(DeleteBehavior.SetNull);

        // Plain Guid columns (no FK constraint — entities don't exist yet)
        builder.Property(e => e.CustomerId)
            .HasColumnName("customer_id");

        builder.Property(e => e.VehicleId)
            .HasColumnName("vehicle_id");

        builder.Property(e => e.SupplierId)
            .HasColumnName("supplier_id");

        builder.Property(e => e.InvoiceId)
            .HasColumnName("invoice_id");

        builder.Property(e => e.EmployeeId)
            .HasColumnName("employee_id");

        builder.Property(e => e.TransactionGroupId)
            .HasColumnName("transaction_group_id");

        // 4. Indexes (M05-F11-R08)

        // Time-range queries per organization
        builder.HasIndex(e => new { e.OrganizationId, e.Date });

        // Customer ledger queries
        builder.HasIndex(e => new { e.CustomerId, e.Date });

        // P&L queries by account head
        builder.HasIndex(e => new { e.AccountHeadId, e.Date });

        // Bank balance queries
        builder.HasIndex(e => new { e.BankAccountId, e.Date });

        // Shift reconciliation
        builder.HasIndex(e => e.ShiftId);
    }
}
