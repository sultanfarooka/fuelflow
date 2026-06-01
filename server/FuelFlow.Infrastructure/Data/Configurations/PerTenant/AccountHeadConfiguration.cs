using FuelFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FuelFlow.Infrastructure.Data.Configurations.PerTenant;

/// <summary>
/// EF Core config for AccountHead (M05-F09).
/// Scoped to Organization; one account head per (org, name) — unique regardless of type.
/// IsSystemManaged heads (fuel-type income heads seeded during onboarding) cannot be
/// deactivated via the API; enforced at the handler layer.
/// </summary>
public class AccountHeadConfiguration : IEntityTypeConfiguration<AccountHead>
{
    public void Configure(EntityTypeBuilder<AccountHead> builder)
    {
        // 1. Table & key
        builder.ToTable("account_heads");

        builder.HasKey(a => a.Id);
        builder.Property(a => a.Id)
            .HasColumnName("id")
            .HasDefaultValueSql("gen_random_uuid()");

        // 2. Non-FK properties
        builder.Property(a => a.Name)
            .HasColumnName("name")
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(a => a.Description)
            .HasColumnName("description")
            .HasMaxLength(255);

        // AccountHeadType: Income = 1, Expense = 2
        builder.Property(a => a.Type)
            .HasColumnName("type")
            .HasConversion<int>()
            .IsRequired();

        builder.Property(a => a.IsActive)
            .HasColumnName("is_active")
            .HasDefaultValue(true)
            .IsRequired();

        builder.Property(a => a.IsSystemManaged)
            .HasColumnName("is_system_managed")
            .HasDefaultValue(false)
            .IsRequired();

        builder.Property(a => a.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("NOW()");

        builder.Property(a => a.UpdatedAt)
            .HasColumnName("updated_at")
            .HasDefaultValueSql("NOW()");

        // 3. Relationships
        // Relationship: AccountHead -> Organization (many-to-one)
        // On delete cascade: if the organization is deleted, its account heads go too
        builder.Property(a => a.OrganizationId)
            .HasColumnName("organization_id")
            .IsRequired();
        builder.HasOne(a => a.Organization)
            .WithMany()
            .HasForeignKey(a => a.OrganizationId)
            .OnDelete(DeleteBehavior.Cascade);

        // 4. Indexes
        // Unique: one name per organization (regardless of type)
        builder.HasIndex(a => new { a.OrganizationId, a.Name })
            .IsUnique();

        // Index for fast list queries filtered by org
        builder.HasIndex(a => a.OrganizationId);
    }
}
