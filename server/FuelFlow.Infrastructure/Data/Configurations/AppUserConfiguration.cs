using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FuelFlow.Domain.Entities;
using FuelFlow.Infrastructure.Identity;

namespace FuelFlow.Infrastructure.Data.Configurations;

/// <summary>
/// Additional configuration for AppUser (on top of Identity). Custom columns and relationship to Organization.
/// </summary>
public class AppUserConfiguration : IEntityTypeConfiguration<AppUser>
{
    public void Configure(EntityTypeBuilder<AppUser> builder)
    {
        // 1. Non-FK properties (Identity handles Id, Email, PasswordHash, etc.)
        builder.Property(u => u.FullName)
            .HasColumnName("full_name")
            .HasMaxLength(200)
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

        builder.Property(u => u.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("NOW()");

        builder.Property(u => u.UpdatedAt)
            .HasColumnName("updated_at")
            .HasDefaultValueSql("NOW()");

        // 2. Relationships (FK property with its relationship block)

        // Relationship: AppUser → Organization (many-to-one, optional)
        // OrganizationId can be null (e.g. before onboarding).
        // On delete SetNull: when an organization is deleted, users' OrganizationId is set to null (no FK violation).
        builder.Property(u => u.OrganizationId)
            .HasColumnName("organization_id");
        builder.HasOne<Organization>()
            .WithMany()
            .HasForeignKey(u => u.OrganizationId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);

        // 3. Indexes
        // Index for fast lookups by organization
        builder.HasIndex(u => u.OrganizationId);
    }
}
