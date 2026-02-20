using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FuelFlow.Domain.Entities;

namespace FuelFlow.Infrastructure.Data.Configurations;

/// <summary>
/// EF Core config for Station entity.
/// Defines the relationship: Organization (1) → Stations (many)
/// </summary>
public class StationConfiguration : IEntityTypeConfiguration<Station>
{
    public void Configure(EntityTypeBuilder<Station> builder)
    {
        builder.ToTable("stations");

        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id)
            .HasColumnName("id")
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(s => s.Name)
            .HasColumnName("name")
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(s => s.Address)
            .HasColumnName("address");

        builder.Property(s => s.Phone)
            .HasColumnName("phone")
            .HasMaxLength(20);

        builder.Property(s => s.LogoUrl)
            .HasColumnName("logo_url")
            .HasMaxLength(500);

        builder.Property(s => s.IsActive)
            .HasColumnName("is_active")
            .HasDefaultValue(true);

        builder.Property(s => s.OrganizationId)
            .HasColumnName("organization_id")
            .IsRequired();

        builder.Property(s => s.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("NOW()");

        builder.Property(s => s.UpdatedAt)
            .HasColumnName("updated_at")
            .HasDefaultValueSql("NOW()");

        // Relationship: Station belongs to Organization
        // WithMany(o => o.Stations) tells EF this is a 1:N relationship
        // OnDelete Cascade: if org is deleted, its stations go too
        builder.HasOne(s => s.Organization)
            .WithMany(o => o.Stations)
            .HasForeignKey(s => s.OrganizationId)
            .OnDelete(DeleteBehavior.Cascade);

        // Index for fast lookups by organization
        builder.HasIndex(s => s.OrganizationId);
    }
}
