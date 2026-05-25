using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FuelFlow.Domain.Entities;
using FuelFlow.Domain.Enums;
using FuelFlow.Infrastructure.Identity;

namespace FuelFlow.Infrastructure.Data.Configurations;

/// <summary>
/// EF Core config for PhoneVerification. user_id → AspNetUsers (AppUser).
/// Domain User navigation ignored, mirroring RefreshTokenConfiguration.
/// </summary>
public class PhoneVerificationConfiguration : IEntityTypeConfiguration<PhoneVerification>
{
    public void Configure(EntityTypeBuilder<PhoneVerification> builder)
    {
        // 1. Table & key
        builder.ToTable("phone_verifications");

        builder.HasKey(pv => pv.Id);
        builder.Property(pv => pv.Id)
            .HasColumnName("id")
            .HasDefaultValueSql("gen_random_uuid()");

        // 2. Non-FK properties
        builder.Property(pv => pv.CodeHash)
            .HasColumnName("code_hash")
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(pv => pv.ExpiresAt)
            .HasColumnName("expires_at")
            .IsRequired();

        builder.Property(pv => pv.AttemptCount)
            .HasColumnName("attempt_count")
            .HasDefaultValue(0)
            .IsRequired();

        builder.Property(pv => pv.ResendCount)
            .HasColumnName("resend_count")
            .HasDefaultValue(0)
            .IsRequired();

        builder.Property(pv => pv.ConsumedAt)
            .HasColumnName("consumed_at");

        builder.Property(pv => pv.Purpose)
            .HasColumnName("purpose")
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(pv => pv.TargetPhone)
            .HasColumnName("target_phone")
            .HasMaxLength(20);

        builder.Property(pv => pv.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("NOW()");

        builder.Property(pv => pv.UpdatedAt)
            .HasColumnName("updated_at")
            .HasDefaultValueSql("NOW()");

        // 3. Relationships

        // Relationship: PhoneVerification → AppUser (many-to-one)
        // On delete cascade: if user is deleted, their OTP rows go too
        builder.Property(pv => pv.UserId)
            .HasColumnName("user_id")
            .IsRequired();
        builder.HasOne<AppUser>()
            .WithMany()
            .HasForeignKey(pv => pv.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // 4. Indexes

        // Active-OTP lookups by (user, purpose), filtered by ConsumedAt in the handler
        builder.HasIndex(pv => new { pv.UserId, pv.Purpose, pv.ConsumedAt });

        // Daily-cap counts per [M01-F09-R12]: COUNT WHERE user_id = ? AND created_at >= ?
        builder.HasIndex(pv => new { pv.UserId, pv.CreatedAt });

        // 5. Ignore (domain navigation; FK points to AppUser)
        builder.Ignore(pv => pv.User);
    }
}
