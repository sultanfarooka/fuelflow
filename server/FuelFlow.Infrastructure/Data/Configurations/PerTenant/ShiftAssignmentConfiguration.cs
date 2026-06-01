using FuelFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FuelFlow.Infrastructure.Data.Configurations.PerTenant;

/// <summary>
/// EF Core config for ShiftAssignment (nozzleman-to-nozzle assignment per shift).
///
/// M14-F01: introduced explicitly during the migration regeneration because EF
/// Core's design-time model validation could no longer resolve <c>ShiftAssignment.User</c>
/// (cross-context to AppUser). The Domain <c>User</c> navigation is now ignored;
/// <see cref="ShiftAssignment.UserId"/> remains as a plain Guid column with
/// app-layer enforcement against the control-plane AppUser repository.
/// </summary>
public class ShiftAssignmentConfiguration : IEntityTypeConfiguration<ShiftAssignment>
{
    public void Configure(EntityTypeBuilder<ShiftAssignment> builder)
    {
        // 1. Table & key
        builder.ToTable("shift_assignments");

        builder.HasKey(sa => sa.Id);
        builder.Property(sa => sa.Id)
            .HasColumnName("id")
            .HasDefaultValueSql("gen_random_uuid()");

        // 2. Non-FK properties
        builder.Property(sa => sa.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("NOW()");

        builder.Property(sa => sa.UpdatedAt)
            .HasColumnName("updated_at")
            .HasDefaultValueSql("NOW()");

        // 3. Relationships

        // Relationship: ShiftAssignment → StationShift (many-to-one, intra-tenant)
        builder.Property(sa => sa.StationShiftId)
            .HasColumnName("station_shift_id")
            .IsRequired();
        builder.HasOne(sa => sa.StationShift)
            .WithMany()
            .HasForeignKey(sa => sa.StationShiftId)
            .OnDelete(DeleteBehavior.Cascade);

        // Relationship: ShiftAssignment → FuelNozzle (many-to-one, intra-tenant)
        builder.Property(sa => sa.FuelNozzleId)
            .HasColumnName("fuel_nozzle_id")
            .IsRequired();
        builder.HasOne(sa => sa.FuelNozzle)
            .WithMany(n => n.ShiftAssignments)
            .HasForeignKey(sa => sa.FuelNozzleId)
            .OnDelete(DeleteBehavior.Cascade);

        // M14-F01: user_id is a plain Guid column with no FK to AspNetUsers.
        // AppUser lives in the control-plane context; app-layer enforces existence.
        builder.Property(sa => sa.UserId)
            .HasColumnName("user_id")
            .IsRequired();
        builder.Ignore(sa => sa.User);

        // 4. Indexes
        builder.HasIndex(sa => sa.StationShiftId);
        builder.HasIndex(sa => sa.FuelNozzleId);
        builder.HasIndex(sa => sa.UserId);
    }
}
