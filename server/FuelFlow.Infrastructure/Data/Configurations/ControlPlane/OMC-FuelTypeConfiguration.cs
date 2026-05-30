using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FuelFlow.Domain.Entities;

namespace FuelFlow.Infrastructure.Data.Configurations.ControlPlane;

public class OMCFuelTypeConfiguration : IEntityTypeConfiguration<OMCFuelTypes>
{
    public void Configure(EntityTypeBuilder<OMCFuelTypes> builder)
    {
        builder.ToTable("omc_fuel_types");
        builder.HasKey(ft => ft.Id);
        builder.Property(ft => ft.Id)
            .HasColumnName("id")
            .HasDefaultValueSql("gen_random_uuid()");
        builder.Property(ft => ft.Name)
            .HasColumnName("name")
            .HasMaxLength(200)
            .IsRequired();
        builder.Property(ft => ft.Unit)
            .HasColumnName("unit")
            .HasMaxLength(10)
            .IsRequired();
        builder.Property(ft => ft.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("NOW()");
        builder.Property(ft => ft.UpdatedAt)
            .HasColumnName("updated_at")
            .HasDefaultValueSql("NOW()");

        // Relationship: OMCFuelTypes → OMC (many-to-one)
        // On delete cascade: if OMC is deleted, its fuel types go too
        builder.Property(ft => ft.OMCId)
            .HasColumnName("omc_id")
            .IsRequired();
        builder.HasOne(ft => ft.OMC)
            .WithMany(o => o.FuelTypes)
            .HasForeignKey(ft => ft.OMCId)
            .OnDelete(DeleteBehavior.Cascade);

        // Index for fast lookups by name
        builder.HasIndex(ft => ft.Name);

        // Seed data: see DataSeeder (runs on startup, idempotent)
    }
}