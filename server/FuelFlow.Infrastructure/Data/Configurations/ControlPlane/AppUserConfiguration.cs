using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FuelFlow.Infrastructure.Identity;

namespace FuelFlow.Infrastructure.Data.Configurations.ControlPlane;

/// <summary>
/// Additional configuration for AppUser (on top of Identity). Custom columns only —
/// the OrganizationId column is kept as a plain Guid? with no FK constraint because
/// Organization lives in the per-tenant AppDbContext after M14-F01.
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

        // 2. Relationships
        //
        // M14-F01: organization_id is a plain Guid? column. The previous
        // HasOne<Organization>() relationship was removed because Organization
        // now lives in the per-tenant AppDbContext. App-layer enforces
        // existence at onboarding time (OnboardingCommandHandler verifies
        // the Organization exists in the tenant DB before setting OrganizationId here).
        builder.Property(u => u.OrganizationId)
            .HasColumnName("organization_id");

        // 3. Indexes
        // Index for fast lookups by organization — still useful even without a FK.
        builder.HasIndex(u => u.OrganizationId);

        // M14-F05-R01: DB-level uniqueness for PhoneNumber.
        // PostgreSQL natively allows multiple NULLs in a standard unique index,
        // so no partial filter is needed — users without a phone don't block each other.
        builder.HasIndex(u => u.PhoneNumber)
               .IsUnique();
    }
}
