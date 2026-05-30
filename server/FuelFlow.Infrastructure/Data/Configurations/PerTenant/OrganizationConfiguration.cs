using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FuelFlow.Domain.Entities;
using FuelFlow.Infrastructure.Identity;

namespace FuelFlow.Infrastructure.Data.Configurations.PerTenant;

/// <summary>
/// EF Core Fluent API configuration for the Organization entity.
/// Table: organizations (snake_case). owner_id â†’ AspNetUsers (AppUser).
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

        // Relationship: Organization â†’ AppUser / Owner (many-to-one; owner_id â†’ AspNetUsers)
        // On delete cascade: if owner is deleted, organization is deleted
        builder.Property(o => o.OwnerId)
            .HasColumnName("owner_id")
            .IsRequired();
        builder.Ignore(o => o.Owner);
        builder.HasOne<AppUser>()
            .WithOne()
            .HasForeignKey<Organization>(o => o.OwnerId)
            .OnDelete(DeleteBehavior.Cascade);

        // Relationship: Organization â†’ Stations (one-to-many; FK on Station)
        // On delete cascade: if organization is deleted, its stations go too
        builder.HasMany(o => o.Stations)
            .WithOne(s => s.Organization)
            .HasForeignKey(s => s.OrganizationId)
            .OnDelete(DeleteBehavior.Cascade);

        // 4. Indexes
        // Index for fast lookups by owner
        builder.HasIndex(o => o.OwnerId);
    }
}
