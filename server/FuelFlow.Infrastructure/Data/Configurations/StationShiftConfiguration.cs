using FuelFlow.Domain.Entities;
using FuelFlow.Domain.Enums;
using FuelFlow.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FuelFlow.Infrastructure.Data.Configurations;

/// <summary>
/// EF Core config for StationShift. OpenedBy/ClosedBy FKs point to AspNetUsers (AppUser).
/// </summary>
public class StationShiftConfiguration : IEntityTypeConfiguration<StationShift>
{
    public void Configure(EntityTypeBuilder<StationShift> builder)
    {
        // 1. Table & key
        builder.ToTable("station_shifts");

        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id)
            .HasColumnName("id")
            .HasDefaultValueSql("gen_random_uuid()");

        // 2. Non-FK properties
        builder.Property(s => s.Status)
            .HasColumnName("status")
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(s => s.OpenedAt)
            .HasColumnName("opened_at")
            .IsRequired();

        builder.Property(s => s.ClosedAt)
            .HasColumnName("closed_at");

        builder.Property(s => s.OpeningCash)
            .HasColumnName("opening_cash")
            .HasPrecision(18, 4)
            .IsRequired();

        builder.Property(s => s.ClosingCash)
            .HasColumnName("closing_cash")
            .HasPrecision(18, 4);

        builder.Property(s => s.ShiftName)
            .HasColumnName("shift_name")
            .HasMaxLength(50);

        builder.Property(s => s.TotalCash)
            .HasColumnName("total_cash")
            .HasPrecision(18, 4);

        builder.Property(s => s.TotalSales)
            .HasColumnName("total_sales")
            .HasPrecision(18, 4);

        builder.Property(s => s.TotalCreditSales)
            .HasColumnName("total_credit_sales")
            .HasPrecision(18, 4);

        builder.Property(s => s.TotalCardSales)
            .HasColumnName("total_card_sales")
            .HasPrecision(18, 4);

        builder.Property(s => s.TotalDigitalSales)
            .HasColumnName("total_digital_sales")
            .HasPrecision(18, 4);

        builder.Property(s => s.TotalExpenses)
            .HasColumnName("total_expenses")
            .HasPrecision(18, 4);

        builder.Property(s => s.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("NOW()");

        builder.Property(s => s.UpdatedAt)
            .HasColumnName("updated_at")
            .HasDefaultValueSql("NOW()");

        // 3. Relationships (FK property with its relationship block)

        // Relationship: StationShift → Station (many-to-one)
        // On delete cascade: if station is deleted, its shifts go too
        builder.Property(s => s.StationId)
            .HasColumnName("station_id")
            .IsRequired();
        builder.HasOne(s => s.Station)
            .WithMany(st => st.StationShifts)
            .HasForeignKey(s => s.StationId)
            .OnDelete(DeleteBehavior.Cascade);

        // Relationship: StationShift → AppUser, opened by (many-to-one, FK to AspNetUsers)
        // On delete restrict: do not delete user who opened shifts
        builder.Property(s => s.OpenedByUserId)
            .HasColumnName("opened_by_user_id")
            .IsRequired();
        builder.HasOne<AppUser>()
            .WithMany()
            .HasForeignKey(s => s.OpenedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Relationship: StationShift → AppUser, closed by (many-to-one, optional, FK to AspNetUsers)
        // On delete restrict: do not delete user who closed shifts
        builder.Property(s => s.ClosedByUserId)
            .HasColumnName("closed_by_user_id");
        builder.HasOne<AppUser>()
            .WithMany()
            .HasForeignKey(s => s.ClosedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // 4. Indexes
        // Index for fast lookups by station
        builder.HasIndex(s => s.StationId);
        // Index for fast lookups by opened-by user
        builder.HasIndex(s => s.OpenedByUserId);
        // Index for fast lookups by closed-by user
        builder.HasIndex(s => s.ClosedByUserId);
        // Index for filtering by shift status
        builder.HasIndex(s => s.Status);

        // 5. Ignore (domain navigations and split collections; FKs point to AppUser; use queries for Opening/Closing)
        builder.Ignore(s => s.OpenedBy);
        builder.Ignore(s => s.ClosedBy);
        builder.Ignore(s => s.OpeningFuelTankReadings);
        builder.Ignore(s => s.ClosingFuelTankReadings);
        builder.Ignore(s => s.OpeningNozzleReadings);
        builder.Ignore(s => s.ClosingNozzleReadings);
        builder.Ignore(s => s.ShiftAssignments);
    }
}
