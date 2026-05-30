using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FuelFlow.Domain.Entities;

namespace FuelFlow.Infrastructure.Data.Configurations.PerTenant;

/// <summary>
/// EF Core Fluent API configuration for the Organization entity.
/// Table: organizations (snake_case).
///
/// M14-F01: OwnerId is a plain Guid column with no FK to AspNetUsers — the
/// AppUser/Organization relationship now crosses DbContexts (Identity lives in
/// ControlPlaneDbContext, Organization stays per-tenant). Handlers enforce
/// "this user exists" against the control-plane repo before insert.
/// </summary>
public class OrganizationConfiguration : IEntityTypeConfiguration<Organization>
{
    public void Configure(EntityTypeBuilder<Organization> builder)
    {
        // 1. Table & key
        builder.ToTable("organizations");

        builder.HasKey(o => o.Id);
        builder.Property(o => o.Id)
            .HasColumnName("id")
            .HasDefaultValueSql("gen_random_uuid()");

        // 2. Non-FK properties
        builder.Property(o => o.Name)
            .HasColumnName("name")
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(o => o.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("NOW()");

        builder.Property(o => o.UpdatedAt)
            .HasColumnName("updated_at")
            .HasDefaultValueSql("NOW()");

        // 3. Relationships (FK property with its relationship block)

        // M14-F01: owner_id is now a plain Guid column. The HasOne<AppUser>()
        // relationship was removed because AppUser lives in the control-plane
        // DbContext. App-layer enforces that the referenced user exists.
        builder.Property(o => o.OwnerId)
            .HasColumnName("owner_id")
            .IsRequired();

        // Relationship: Organization → Stations (one-to-many; FK on Station, intra-tenant)
        // On delete cascade: if organization is deleted, its stations go too
        builder.HasMany(o => o.Stations)
            .WithOne(s => s.Organization)
            .HasForeignKey(s => s.OrganizationId)
            .OnDelete(DeleteBehavior.Cascade);

        // 4. Indexes
        // Index for fast lookups by owner — still useful even without a FK constraint.
        builder.HasIndex(o => o.OwnerId);
    }
}
