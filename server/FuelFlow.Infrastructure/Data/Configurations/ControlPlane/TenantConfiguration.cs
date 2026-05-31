using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FuelFlow.Domain.Entities;

namespace FuelFlow.Infrastructure.Data.Configurations.ControlPlane;

/// <summary>
/// EF Core config for the control-plane <see cref="Tenant"/> registry (M14-F01-R03).
/// One row per provisioned Organization; <c>Id == Organization.Id</c> by application
/// convention (no cross-context FK — Organization lives in <c>AppDbContext</c>).
/// </summary>
public class TenantConfiguration : IEntityTypeConfiguration<Tenant>
{
    public void Configure(EntityTypeBuilder<Tenant> builder)
    {
        // 1. Table & key
        builder.ToTable("tenants");

        builder.HasKey(t => t.Id);
        builder.Property(t => t.Id)
            .HasColumnName("id");
        // No `gen_random_uuid()` default — Id is assigned by the caller to
        // match the Organization row's Id (M14-F03 provisioning saga).

        // 2. Non-FK properties
        builder.Property(t => t.DatabaseName)
            .HasColumnName("database_name")
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(t => t.Status)
            .HasColumnName("status")
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(t => t.ProvisionedAt)
            .HasColumnName("provisioned_at");

        builder.Property(t => t.DeletedAt)
            .HasColumnName("deleted_at");

        builder.Property(t => t.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("NOW()");

        builder.Property(t => t.UpdatedAt)
            .HasColumnName("updated_at")
            .HasDefaultValueSql("NOW()");

        // 3. Relationships — none (cross-context links to Organization are
        // app-layer enforced; see M14-F01 R04 + impl doc).

        // 4. Indexes
        // Unique index on database_name — two tenants must not share a DB.
        builder.HasIndex(t => t.DatabaseName)
            .IsUnique();

        // Index by status for platform-admin queries (e.g. list all
        // Provisioning rows to detect stuck provisions; M14-F03).
        builder.HasIndex(t => t.Status);
    }
}
