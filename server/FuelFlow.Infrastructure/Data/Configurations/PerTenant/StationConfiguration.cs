using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FuelFlow.Domain.Entities;
using StationEntities = FuelFlow.Domain.Entities.StationEntities;

namespace FuelFlow.Infrastructure.Data.Configurations.PerTenant;

/// <summary>
/// EF Core config for Station. Organization (1) â†’ Stations (many).
/// </summary>
public class StationConfiguration : IEntityTypeConfiguration<Station>
{
    public void Configure(EntityTypeBuilder<Station> builder)
    {
        // 1. Table & key
        builder.ToTable("stations");

        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id)
            .HasColumnName("id")
            .HasDefaultValueSql("gen_random_uuid()");

        // 2. Non-FK properties
        builder.Property(s => s.Name)
            .HasColumnName("name")
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(s => s.Address)
            .HasColumnName("address");

        builder.Property(s => s.Phone)
            .HasColumnName("phone")
            .HasMaxLength(20);

        builder.Property(s => s.LogoUrl)
            .HasColumnName("logo_url")
            .HasMaxLength(500);

        builder.Property(s => s.IsActive)
            .HasColumnName("is_active")
            .HasDefaultValue(true);

        builder.Property(s => s.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("NOW()");

        builder.Property(s => s.UpdatedAt)
            .HasColumnName("updated_at")
            .HasDefaultValueSql("NOW()");

        // 3. Relationships (FK property with its relationship block)

        // Relationship: Station â†’ Organization (many-to-one)
        // On delete cascade: if org is deleted, its stations go too
        builder.Property(s => s.OrganizationId)
            .HasColumnName("organization_id")
            .IsRequired();
        builder.HasOne(s => s.Organization)
            .WithMany(o => o.Stations)
            .HasForeignKey(s => s.OrganizationId)
            .OnDelete(DeleteBehavior.Cascade);

        // Cross-context FK column — references control-plane omcs by Guid.
        // M14-F02: nav property + HasOne removed; FK constraint dropped via migration.
        // Handlers use IOMCRepository for explicit lookups.
        builder.Property(s => s.OMCId)
            .HasColumnName("omc_id")
            .IsRequired();

        // Relationship: Station â†’ FuelTanks (one-to-many; FK on FuelTank)
        // On delete cascade: if station is deleted, its fuel tanks go too
        builder.HasMany(s => s.FuelTanks)
            .WithOne(f => f.Station)
            .HasForeignKey(f => f.StationId)
            .OnDelete(DeleteBehavior.Cascade);

        // Relationship: Station â†’ FuelNozzles (one-to-many; FK on FuelNozzle)
        // On delete cascade: if station is deleted, its fuel nozzles go too
        builder.HasMany(s => s.FuelNozzles)
            .WithOne(f => f.Station)
            .HasForeignKey(f => f.StationId)
            .OnDelete(DeleteBehavior.Cascade);

        // Relationship: Station â†’ StationShifts (one-to-many; FK on StationShift)
        // On delete cascade: if station is deleted, its shifts go too
        builder.HasMany(s => s.StationShifts)
            .WithOne(s => s.Station)
            .HasForeignKey(s => s.StationId)
            .OnDelete(DeleteBehavior.Cascade);

        // Relationship: Station â†’ FuelPrices (one-to-many; FK on FuelPrices)
        // On delete cascade: if station is deleted, its fuel prices go too
        builder.HasMany(s => s.FuelPrices)
            .WithOne(f => f.Station)
            .HasForeignKey(f => f.StationId)
            .OnDelete(DeleteBehavior.Cascade);

        // M12-F01: setup completion flag (default false â€” dashboard blocked until wizard done)
        builder.Property(s => s.IsSetupComplete)
            .HasColumnName("is_setup_complete")
            .HasDefaultValue(false);

        // M12-F01: payment methods as JSONB array; Cash always pre-seeded
        builder.Property(s => s.AcceptedPaymentMethods)
            .HasColumnName("accepted_payment_methods")
            .HasColumnType("jsonb")
            .HasDefaultValueSql("'[\"Cash\"]'::jsonb");

        // 3b. Relationship: Station â†’ StationShiftConfig (one-to-one, FK on StationShiftConfig)
        builder.HasOne(s => s.ShiftConfig)
            .WithOne(c => c.Station)
            .HasForeignKey<StationEntities.StationShiftConfig>(c => c.StationId)
            .OnDelete(DeleteBehavior.Cascade);

        // 4. Indexes
        // Index for fast lookups by organization
        builder.HasIndex(s => s.OrganizationId);

        // 5. Ignore (domain many-to-many with User; persistence uses UserStation junction)
        builder.Ignore(s => s.Employees);
    }
}
