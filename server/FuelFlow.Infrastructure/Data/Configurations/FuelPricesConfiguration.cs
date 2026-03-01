using FuelFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FuelFlow.Infrastructure.Data.Configurations;

/// <summary>
/// EF Core config for FuelPrices. Price history per fuel type per station.
/// </summary>
public class FuelPricesConfiguration : IEntityTypeConfiguration<FuelPrices>
{
    public void Configure(EntityTypeBuilder<FuelPrices> builder)
    {
        // 1. Table & key
        builder.ToTable("fuel_prices");

        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id)
            .HasColumnName("id")
            .HasDefaultValueSql("gen_random_uuid()");

        // 2. Non-FK properties
        builder.Property(p => p.Price)
            .HasColumnName("price")
            .HasPrecision(18, 4)
            .IsRequired();

        builder.Property(p => p.EffectiveFrom)
            .HasColumnName("effective_from")
            .IsRequired();

        builder.Property(p => p.EffectiveTo)
            .HasColumnName("effective_to");

        builder.Property(p => p.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("NOW()");

        builder.Property(p => p.UpdatedAt)
            .HasColumnName("updated_at")
            .HasDefaultValueSql("NOW()");

        // 3. Relationships (FK property with its relationship block)

        // Relationship: FuelPrices → FuelType (many-to-one)
        // On delete cascade: if fuel type is deleted, its price rows go too
        builder.Property(p => p.FuelTypeId)
            .HasColumnName("fuel_type_id")
            .IsRequired();
        builder.HasOne(p => p.FuelType)
            .WithMany()
            .HasForeignKey(p => p.FuelTypeId)
            .OnDelete(DeleteBehavior.Cascade);

        // Relationship: FuelPrices → Station (many-to-one)
        // On delete cascade: if station is deleted, its fuel prices go too
        builder.Property(p => p.StationId)
            .HasColumnName("station_id")
            .IsRequired();
        builder.HasOne(p => p.Station)
            .WithMany(s => s.FuelPrices)
            .HasForeignKey(p => p.StationId)
            .OnDelete(DeleteBehavior.Cascade);

        // 4. Indexes
        // Index for fast lookups by fuel type
        builder.HasIndex(p => p.FuelTypeId);
        // Index for fast lookups by station
        builder.HasIndex(p => p.StationId);
        // Index for price history lookups (station + fuel type + effective from)
        builder.HasIndex(p => new { p.StationId, p.FuelTypeId, p.EffectiveFrom });
    }
}
