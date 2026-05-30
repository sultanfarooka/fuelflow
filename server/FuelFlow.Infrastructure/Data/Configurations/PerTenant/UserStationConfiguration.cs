using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FuelFlow.Infrastructure.Data;

namespace FuelFlow.Infrastructure.Data.Configurations.PerTenant;

/// <summary>
/// EF Core config for user_stations junction table.
///
/// M14-F01: <c>user_id</c> is a plain Guid column with no FK constraint —
/// AppUser lives in the ControlPlaneDbContext while this junction is per-tenant.
/// Handlers enforce "this AppUser exists" against the control-plane repo before
/// inserting a row here.
/// </summary>
public class UserStationConfiguration : IEntityTypeConfiguration<UserStation>
{
    public void Configure(EntityTypeBuilder<UserStation> builder)
    {
        // 1. Table & key (composite PK)
        builder.ToTable("user_stations");

        builder.HasKey(us => new { us.StationId, us.UserId });

        // 2. Relationships (FK property with its relationship block)

        // Relationship: UserStation → Station (many-to-one, intra-tenant)
        // On delete cascade: if station is deleted, its user assignments go too
        builder.Property(us => us.StationId)
            .HasColumnName("station_id");
        builder.HasOne(us => us.Station)
            .WithMany()
            .HasForeignKey(us => us.StationId)
            .OnDelete(DeleteBehavior.Cascade);

        // M14-F01: user_id is a plain Guid column. The previous HasOne(us => us.User)
        // relationship to AppUser was removed — AppUser lives in the control-plane
        // DbContext. App-layer enforces referential integrity.
        builder.Property(us => us.UserId)
            .HasColumnName("user_id");

        // 3. Indexes
        // Index for fast lookups by station
        builder.HasIndex(us => us.StationId);
        // Index for fast lookups by user — still useful even without a FK constraint.
        builder.HasIndex(us => us.UserId);
    }
}
