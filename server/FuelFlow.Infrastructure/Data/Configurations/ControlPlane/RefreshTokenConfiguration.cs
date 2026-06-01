using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FuelFlow.Domain.Entities;
using FuelFlow.Infrastructure.Identity;

namespace FuelFlow.Infrastructure.Data.Configurations.ControlPlane;

/// <summary>
/// EF Core config for RefreshToken. user_id â†’ AspNetUsers (AppUser). Domain User navigation ignored.
/// </summary>
public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        // 1. Table & key
        builder.ToTable("refresh_tokens");

        builder.HasKey(rt => rt.Id);
        builder.Property(rt => rt.Id)
            .HasColumnName("id")
            .HasDefaultValueSql("gen_random_uuid()");

        // 2. Relationships (FK property with its relationship block)

        // Relationship: RefreshToken â†’ AppUser (many-to-one)
        // On delete cascade: if user is deleted, their refresh tokens are removed
        builder.Property(rt => rt.UserId)
            .HasColumnName("user_id")
            .IsRequired();
        builder.HasOne<AppUser>()
            .WithMany()
            .HasForeignKey(rt => rt.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // 3. Non-FK properties
        builder.Property(rt => rt.TokenHash)
            .HasColumnName("token_hash")
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(rt => rt.ExpiresAt)
            .HasColumnName("expires_at")
            .IsRequired();

        builder.Property(rt => rt.RevokedAt)
            .HasColumnName("revoked_at");

        builder.Property(rt => rt.ReplacedByToken)
            .HasColumnName("replaced_by_token")
            .HasMaxLength(500);

        builder.Property(rt => rt.IpAddress)
            .HasColumnName("ip_address")
            .HasMaxLength(100);

        builder.Property(rt => rt.UserAgent)
            .HasColumnName("user_agent")
            .HasMaxLength(500);

        builder.Property(rt => rt.DeviceId)
            .HasColumnName("device_id")
            .HasMaxLength(200);

        builder.Property(rt => rt.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("NOW()");

        builder.Property(rt => rt.UpdatedAt)
            .HasColumnName("updated_at")
            .HasDefaultValueSql("NOW()");

        // 4. Indexes
        // Index for fast lookups by user
        builder.HasIndex(rt => rt.UserId);
        // Index for token lookup (unique)
        builder.HasIndex(rt => rt.TokenHash)
            .IsUnique();

        // 5. Ignore (domain navigation; FK points to AppUser)
        builder.Ignore(rt => rt.User);
    }
}
