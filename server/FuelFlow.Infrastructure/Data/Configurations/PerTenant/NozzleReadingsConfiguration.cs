using FuelFlow.Domain.Entities;
using FuelFlow.Domain.Enums;
using FuelFlow.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FuelFlow.Infrastructure.Data.Configurations.PerTenant;

/// <summary>
/// EF Core config for NozzleReadings (meter readings). Opening/Closing totalizer per nozzle per shift.
/// </summary>
public class NozzleReadingsConfiguration : IEntityTypeConfiguration<NozzleReadings>
{
    public void Configure(EntityTypeBuilder<NozzleReadings> builder)
    {
        builder.ToTable("meter_readings");

        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id)
            .HasColumnName("id")
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(r => r.ReadingType)
            .HasColumnName("reading_type")
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(r => r.TotalizerValue)
            .HasColumnName("totalizer_value")
            .HasPrecision(18, 4)
            .IsRequired();

        builder.Property(r => r.RecordedAt)
            .HasColumnName("recorded_at")
            .IsRequired();

        builder.Property(r => r.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("NOW()");

        builder.Property(r => r.UpdatedAt)
            .HasColumnName("updated_at")
            .HasDefaultValueSql("NOW()");

        builder.Property(r => r.FuelNozzleId)
            .HasColumnName("nozzle_id")
            .IsRequired();
        builder.HasOne(r => r.FuelNozzle)
            .WithMany()
            .HasForeignKey(r => r.FuelNozzleId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Property(r => r.StationShiftId)
            .HasColumnName("shift_id")
            .IsRequired();
        builder.HasOne(r => r.StationShift)
            .WithMany()
            .HasForeignKey(r => r.StationShiftId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Property(r => r.RecordedByUserId)
            .HasColumnName("recorded_by_user_id");
        builder.HasOne<AppUser>()
            .WithMany()
            .HasForeignKey(r => r.RecordedByUserId)
            .OnDelete(DeleteBehavior.SetNull);
        builder.Ignore(r => r.RecordedBy);

        builder.HasIndex(r => r.FuelNozzleId);
        builder.HasIndex(r => r.StationShiftId);
    }
}
