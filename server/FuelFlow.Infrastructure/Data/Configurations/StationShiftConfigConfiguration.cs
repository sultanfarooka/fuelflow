using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FuelFlow.Domain.Entities.StationEntities;

namespace FuelFlow.Infrastructure.Data.Configurations;

/// <summary>
/// EF Core config for StationShiftConfig (M12-F01-R08).
/// One-to-one with Station; FK is on StationShiftConfig.
/// </summary>
public class StationShiftConfigConfiguration : IEntityTypeConfiguration<StationShiftConfig>
{
    public void Configure(EntityTypeBuilder<StationShiftConfig> builder)
    {
        // 1. Table & key
        builder.ToTable("station_shift_configs");

        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id)
            .HasColumnName("id")
            .HasDefaultValueSql("gen_random_uuid()");

        // 2. Non-FK properties
        builder.Property(c => c.ShiftCount)
            .HasColumnName("shift_count")
            .IsRequired();

        builder.Property(c => c.Shift1Name)
            .HasColumnName("shift1_name")
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(c => c.Shift1StartTime)
            .HasColumnName("shift1_start_time")
            .HasColumnType("time")
            .IsRequired();

        builder.Property(c => c.Shift2Name)
            .HasColumnName("shift2_name")
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(c => c.Shift2StartTime)
            .HasColumnName("shift2_start_time")
            .HasColumnType("time")
            .IsRequired();

        builder.Property(c => c.Shift3Name)
            .HasColumnName("shift3_name")
            .HasMaxLength(100);

        builder.Property(c => c.Shift3StartTime)
            .HasColumnName("shift3_start_time")
            .HasColumnType("time");

        builder.Property(c => c.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("NOW()");

        builder.Property(c => c.UpdatedAt)
            .HasColumnName("updated_at")
            .HasDefaultValueSql("NOW()");

        // 3. Relationships
        // Relationship: StationShiftConfig → Station (one-to-one, FK here)
        // On delete cascade: if station is deleted, its shift config goes too
        builder.Property(c => c.StationId)
            .HasColumnName("station_id")
            .IsRequired();

        // The inverse side (Station.HasOne(ShiftConfig)) is configured in StationConfiguration
        // to keep the principal side ownership clear.

        // 4. Indexes
        // Unique index: only one shift config per station
        builder.HasIndex(c => c.StationId).IsUnique();
    }
}
