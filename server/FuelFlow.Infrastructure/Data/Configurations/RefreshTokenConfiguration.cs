using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FuelFlow.Domain.Entities;
using FuelFlow.Infrastructure.Identity;

namespace FuelFlow.Infrastructure.Data.Configurations;

/// <summary>
/// EF Core Fluent API configuration for the RefreshToken entity.
/// 
/// TABLE NAME: refresh_tokens (snake_case per PRD convention)
/// 
/// IMPORTANT:
/// - The Domain RefreshToken links to a User via UserId (Guid).
/// - In the database, this foreign key points to Infrastructure's AppUser
///   (the Identity user table).
/// - We IGNORE the Domain navigation property to keep Domain and Infrastructure
///   layers decoupled at the EF level.
/// </summary>
public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.ToTable("refresh_tokens");

        // Primary key
        builder.HasKey(rt => rt.Id);
        builder.Property(rt => rt.Id)
            .HasColumnName("id")
            .HasDefaultValueSql("gen_random_uuid()");

        // Foreign key to AppUser (Identity user table)
        builder.Property(rt => rt.UserId)
            .HasColumnName("user_id")
            .IsRequired();

        // Relationship: many refresh tokens per user
        builder.HasOne<AppUser>()
            .WithMany()
            .HasForeignKey(rt => rt.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Token hash and metadata
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

        // Ignore domain-level navigation property (RefreshToken.User)
        // so EF doesn't try to map Domain.User as an entity here.
        builder.Ignore(rt => rt.User);

        // Indexes
        builder.HasIndex(rt => rt.UserId);
        builder.HasIndex(rt => rt.TokenHash)
            .IsUnique();
    }
}

