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

        // M08-F08: active/inactive flag. Default true so legacy rows backfill to active.
        builder.Property(f => f.IsActive)
            .HasColumnName("is_active")
            .HasDefaultValue(true);

        builder.Property(f => f.OMCId)
            .HasColumnName("omc_id");

        builder.Property(f => f.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("NOW()");

        builder.Property(f => f.UpdatedAt)
            .HasColumnName("updated_at")
            .HasDefaultValueSql("NOW()");

        // 3. Relationships
        //
        // M14-F01: station_id is now a plain Guid? column with no FK. The
        // previous HasOne(f => f.Station).OnDelete(SetNull) relationship would
        // pull Station (per-tenant) into the control-plane model, which then
        // cascades through Station's entire navigation tree (FuelTanks,
        // FuelNozzles, StationShifts, FuelPrices). The navigation property
        // on the Domain FuelType entity has also been dropped.
        builder.Property(f => f.StationId)
            .HasColumnName("station_id");

        // 4. Indexes
        // Index for fast lookups by station — still useful even without a FK.
        builder.HasIndex(f => f.StationId);
    }
}
