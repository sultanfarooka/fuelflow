using FuelFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FuelFlow.Infrastructure.Data.Configurations.PerTenant;

/// <summary>
/// EF Core config for FuelTank. Many-to-one to FuelType and Station; one-to-one with DipChart (FK on DipChart).
/// </summary>
public class FuelTankConfiguration : IEntityTypeConfiguration<FuelTank>
{
    public void Configure(EntityTypeBuilder<FuelTank> builder)
    {
        // 1. Table & key
        builder.ToTable("fuel_tanks");

        builder.HasKey(f => f.Id);
        builder.Property(f => f.Id)
            .HasColumnName("id")
            .HasDefaultValueSql("gen_random_uuid()");

        // 2. Non-FK properties
        builder.Property(f => f.Name)
            .HasColumnName("name")
            .HasMaxLength(200);

        builder.Property(f => f.CapacityLiters)
            .HasColumnName("capacity_liters")
            .IsRequired();

        builder.Property(f => f.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("NOW()");

        builder.Property(f => f.UpdatedAt)
            .HasColumnName("updated_at")
            .HasDefaultValueSql("NOW()");

        // 3. Relationships (FK property with its relationship block)

        // Cross-context FK column — references control-plane fuel_types by Guid.
        // M14-F02: nav property + HasOne removed; FK constraint dropped via migration.
        // Handlers use IFuelTypeRepository for explicit lookups.
        builder.Property(f => f.FuelTypeId)
            .HasColumnName("fuel_type_id")
            .IsRequired();

        // Relationship: FuelTank â†’ Station (many-to-one)
        // On delete cascade: if station is deleted, its fuel tanks go too
        builder.Property(f => f.StationId)
            .HasColumnName("station_id")
            .IsRequired();
        builder.HasOne(f => f.Station)
            .WithMany(s => s.FuelTanks)
            .HasForeignKey(f => f.StationId)
            .OnDelete(DeleteBehavior.Cascade);

        // Relationship: FuelTank â†” DipChart (one-to-one, FK on DipChart)
        builder.HasOne(f => f.DipChart)
            .WithOne(d => d.FuelTank)
            .HasForeignKey<DipChart>(d => d.TankId);

        // 4. Indexes
        // Index for fast lookups by fuel type
        builder.HasIndex(f => f.FuelTypeId);
        // Index for fast lookups by station
        builder.HasIndex(f => f.StationId);

        // Unique index: tank name per station (null names allowed multiple times)
        builder.HasIndex(f => new { f.StationId, f.Name })
            .IsUnique();
    }
}
