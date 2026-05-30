using FuelFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FuelFlow.Infrastructure.Data.Configurations.ControlPlane;

/// <summary>
/// EF Core config for FuelType. StationId null = predefined (seeded); set = custom per station.
/// </summary>
public class FuelTypeConfiguration : IEntityTypeConfiguration<FuelType>
{
    public void Configure(EntityTypeBuilder<FuelType> builder)
    {
        // 1. Table & key
        builder.ToTable("fuel_types");

        builder.HasKey(f => f.Id);
        builder.Property(f => f.Id)
            .HasColumnName("id")
            .HasDefaultValueSql("gen_random_uuid()");

        // 2. Non-FK properties
        builder.Property(f => f.Name)
            .HasColumnName("name")
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(f => f.Unit)
            .HasColumnName("unit")
            .HasMaxLength(10)
            .IsRequired();

        builder.Property(f => f.IsCustom)
            .HasColumnName("is_custom")
            .HasDefaultValue(false);

        builder.Property(f => f.OMCId)
            .HasColumnName("omc_id");

        builder.Property(f => f.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("NOW()");

        builder.Property(f => f.UpdatedAt)
            .HasColumnName("updated_at")
            .HasDefaultValueSql("NOW()");

        // 3. Relationships (FK property with its relationship block)

        // Relationship: FuelType â†’ Station (many-to-one, optional)
        // StationId null = predefined (seeded); set = custom type for this station
        // On delete set null: if station is deleted, custom types become predefined
        builder.Property(f => f.StationId)
            .HasColumnName("station_id");
        builder.HasOne(f => f.Station)
            .WithMany()
            .HasForeignKey(f => f.StationId)
            .OnDelete(DeleteBehavior.SetNull);

        // 4. Indexes
        // Index for fast lookups by station
        builder.HasIndex(f => f.StationId);
    }
}
