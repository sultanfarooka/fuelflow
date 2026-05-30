using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FuelFlow.Infrastructure.Data;

namespace FuelFlow.Infrastructure.Data.Configurations.PerTenant;

/// <summary>
/// EF Core config for user_stations junction table (Station many-to-many AppUser).
/// </summary>
public class UserStationConfiguration : IEntityTypeConfiguration<UserStation>
{
    public void Configure(EntityTypeBuilder<UserStation> builder)
    {
        // 1. Table & key (composite PK)
        builder.ToTable("user_stations");

        builder.HasKey(us => new { us.StationId, us.UserId });

        // 2. Relationships (FK property with its relationship block)

        // Relationship: UserStation â†’ Station (many-to-one)
        // On delete cascade: if station is deleted, its user assignments go too
        builder.Property(us => us.StationId)
            .HasColumnName("station_id");
        builder.HasOne(us => us.Station)
            .WithMany()
            .HasForeignKey(us => us.StationId)
            .OnDelete(DeleteBehavior.Cascade);

        // Relationship: UserStation â†’ AppUser (many-to-one)
        // On delete cascade: if user is deleted, their station assignments go too
        builder.Property(us => us.UserId)
            .HasColumnName("user_id");
        builder.HasOne(us => us.User)
            .WithMany()
            .HasForeignKey(us => us.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // 3. Indexes
        // Index for fast lookups by station
        builder.HasIndex(us => us.StationId);
        // Index for fast lookups by user
        builder.HasIndex(us => us.UserId);
    }
}
