using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FuelFlow.Domain.Entities;

namespace FuelFlow.Infrastructure.Data.Configurations.PerTenant;

/// <summary>
/// EF Core config for BankAccount (M12-F01-R13).
/// Scoped to Organization; multiple accounts per org supported.
/// IsPrimary uniqueness is enforced at the application layer (only one primary per org).
/// </summary>
public class BankAccountConfiguration : IEntityTypeConfiguration<BankAccount>
{
    public void Configure(EntityTypeBuilder<BankAccount> builder)
    {
        // 1. Table & key
        builder.ToTable("bank_accounts");

        builder.HasKey(b => b.Id);
        builder.Property(b => b.Id)
            .HasColumnName("id")
            .HasDefaultValueSql("gen_random_uuid()");

        // 2. Non-FK properties
        builder.Property(b => b.BankName)
            .HasColumnName("bank_name")
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(b => b.AccountNumber)
            .HasColumnName("account_number")
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(b => b.AccountTitle)
            .HasColumnName("account_title")
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(b => b.IsPrimary)
            .HasColumnName("is_primary")
            .HasDefaultValue(false);

        builder.Property(b => b.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("NOW()");

        builder.Property(b => b.UpdatedAt)
            .HasColumnName("updated_at")
            .HasDefaultValueSql("NOW()");

        // 3. Relationships
        // Relationship: BankAccount â†’ Organization (many-to-one)
        // On delete cascade: if org is deleted, its bank accounts go too
        builder.Property(b => b.OrganizationId)
            .HasColumnName("organization_id")
            .IsRequired();
        builder.HasOne(b => b.Organization)
            .WithMany()
            .HasForeignKey(b => b.OrganizationId)
            .OnDelete(DeleteBehavior.Cascade);

        // 4. Indexes
        // Index for fast lookups by organization
        builder.HasIndex(b => b.OrganizationId);

        // Index for (org, is_primary) â€” used when demoting the existing primary on create
        builder.HasIndex(b => new { b.OrganizationId, b.IsPrimary });
    }
}
