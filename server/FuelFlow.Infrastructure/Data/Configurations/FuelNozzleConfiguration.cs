using FuelFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FuelFlow.Infrastructure.Data.Configurations;

/// <summary>
/// EF Core config for FuelNozzle. Many nozzles per station and per tank.
/// </summary>
public class FuelNozzleConfiguration : IEntityTypeConfiguration<FuelNozzle>
{
    public void Configure(EntityTypeBuilder<FuelNozzle> builder)
    {
        // 1. Table & key
        builder.ToTable("fuel_nozzles");

        builder.HasKey(n => n.Id);
        builder.Property(n => n.Id)
            .HasColumnName("id")
            .HasDefaultValueSql("gen_random_uuid()");

        // 2. Non-FK properties
        builder.Property(n => n.NozzleNumber)
            .HasColumnName("nozzle_number")
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(n => n.IsActive)
            .HasColumnName("is_active")
            .HasDefaultValue(true);

        builder.Property(n => n.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("NOW()");

        builder.Property(n => n.UpdatedAt)
            .HasColumnName("updated_at")
            .HasDefaultValueSql("NOW()");

        // 3. Relationships (FK property with its relationship block)

        // Relationship: FuelNozzle → FuelTank (many-to-one)
        // On delete cascade: if tank is deleted, its nozzles go too
        builder.Property(n => n.TankId)
            .HasColumnName("tank_id")
            .IsRequired();
        builder.HasOne(n => n.FuelTank)
            .WithMany()
            .HasForeignKey(n => n.TankId)
            .OnDelete(DeleteBehavior.Cascade);

        // Relationship: FuelNozzle → Station (many-to-one)
        // On delete cascade: if station is deleted, its fuel nozzles go too
        builder.Property(n => n.StationId)
            .HasColumnName("station_id")
            .IsRequired();
        builder.HasOne(n => n.Station)
            .WithMany(s => s.FuelNozzles)
            .HasForeignKey(n => n.StationId)
            .OnDelete(DeleteBehavior.Cascade);

        // 4. Indexes
        // Index for fast lookups by tank
        builder.HasIndex(n => n.TankId);
        // Index for fast lookups by station
        builder.HasIndex(n => n.StationId);

        // Unique index: nozzle number per tank
        builder.HasIndex(n => new { n.TankId, n.NozzleNumber })
            .IsUnique();
    }
}
