using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FuelFlow.Infrastructure.Data.Configurations;

public class OMCConfiguration : IEntityTypeConfiguration<OMC>
{
    public void Configure(EntityTypeBuilder<OMC> builder)
    {
        builder.ToTable("omcs");

        builder.HasKey(o => o.Id);
        builder.Property(o => o.Id)
            .HasColumnName("id")
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(o => o.Name)
            .HasColumnName("name")
            .HasMaxLength(200)
            .IsRequired()
            .IsUnicode(true);

        builder.HasIndex(o => o.Name)
            .IsUnique();

        builder.Property(o => o.Address)
            .HasColumnName("address")
            .HasMaxLength(200);

        builder.Property(o => o.Phone)
            .HasColumnName("phone")
            .HasMaxLength(20);

        builder.Property(o => o.Email)
            .HasColumnName("email")
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(o => o.Website)
            .HasColumnName("website")
            .HasMaxLength(255);

        builder.Property(o => o.LogoUrl)
            .HasColumnName("logo_url")
            .HasMaxLength(500);

        builder.Property(o => o.ContactPerson)
            .HasColumnName("contact_person")
            .HasMaxLength(200);

        builder.Property(o => o.ContactPersonEmail)
            .HasColumnName("contact_person_email")
            .HasMaxLength(255);

        builder.Property(o => o.ContactPersonPhone)
            .HasColumnName("contact_person_phone")
            .HasMaxLength(20);

        builder.Property(o => o.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("NOW()");

        builder.Property(o => o.UpdatedAt)
            .HasColumnName("updated_at")
            .HasDefaultValueSql("NOW()");

        // Relationship to OMCFuelTypes is configured in OMCFuelTypeConfiguration (one-to-many, cascade delete).

        // Index for fast lookups by name
        builder.HasIndex(o => o.Name);

        // Seed data: see DataSeeder (runs on startup, idempotent)
    }
}