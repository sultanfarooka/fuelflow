using FuelFlow.Domain.Entities;
using FuelFlow.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FuelFlow.Infrastructure.Data.Configurations.PerTenant;

/// <summary>
/// EF Core config for FuelTankReading (tank dip readings). Opening/Closing dip per tank per shift.
/// </summary>
public class FuelTankReadingConfiguration : IEntityTypeConfiguration<FuelTankReading>
{
    public void Configure(EntityTypeBuilder<FuelTankReading> builder)
    {
        builder.ToTable("tank_dip_readings");

        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id)
            .HasColumnName("id")
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(r => r.ReadingType)
            .HasColumnName("reading_type")
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(r => r.DepthCm)
            .HasColumnName("depth_cm")
            .HasPrecision(18, 4)
            .IsRequired();

        builder.Property(r => r.VolumeLiters)
            .HasColumnName("volume_liters")
            .HasPrecision(18, 4)
            .IsRequired();

        builder.Property(r => r.ReadAt)
            .HasColumnName("read_at")
            .IsRequired();

        builder.Property(r => r.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("NOW()");

        builder.Property(r => r.UpdatedAt)
            .HasColumnName("updated_at")
            .HasDefaultValueSql("NOW()");

        builder.Property(r => r.FuelTankId)
            .HasColumnName("tank_id")
            .IsRequired();
        builder.HasOne(r => r.FuelTank)
            .WithMany()
            .HasForeignKey(r => r.FuelTankId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Property(r => r.StationShiftId)
            .HasColumnName("shift_id");
        builder.HasOne(r => r.StationShift)
            .WithMany()
            .HasForeignKey(r => r.StationShiftId)
            .OnDelete(DeleteBehavior.SetNull);

        // M14-F01: recorded_by_user_id is a plain Guid? column with no FK to
        // AspNetUsers. AppUser lives in the control-plane context.
        builder.Property(r => r.RecordedByUserId)
            .HasColumnName("recorded_by_user_id");
        builder.Ignore(r => r.RecordedBy);

        builder.HasIndex(r => r.FuelTankId);
        builder.HasIndex(r => r.StationShiftId);
    }
}
