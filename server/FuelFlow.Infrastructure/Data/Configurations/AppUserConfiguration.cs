using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FuelFlow.Infrastructure.Identity;

namespace FuelFlow.Infrastructure.Data.Configurations;

/// <summary>
/// Additional configuration for our AppUser (on top of what Identity provides).
/// 
/// Identity already configures the base AspNetUsers table. Here we add
/// our custom columns and the relationship to Organization.
/// </summary>
public class AppUserConfiguration : IEntityTypeConfiguration<AppUser>
{
    public void Configure(EntityTypeBuilder<AppUser> builder)
    {
        // Our custom columns (Identity handles Email, PasswordHash, etc.)
        builder.Property(u => u.FullName)
            .HasColumnName("full_name")
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(u => u.Role)
            .HasColumnName("role")
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(u => u.IsActive)
            .HasColumnName("is_active")
            .HasDefaultValue(true);

        builder.Property(u => u.SessionTimeoutMins)
            .HasColumnName("session_timeout_mins")
            .HasDefaultValue(30);

        builder.Property(u => u.PinHash)
            .HasColumnName("pin_hash")
            .HasMaxLength(500);

        builder.Property(u => u.OrganizationId)
            .HasColumnName("organization_id")
            .IsRequired();

        builder.Property(u => u.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("NOW()");

        builder.Property(u => u.UpdatedAt)
            .HasColumnName("updated_at")
            .HasDefaultValueSql("NOW()");

        // Index for fast lookups by organization
        builder.HasIndex(u => u.OrganizationId);
    }
}
