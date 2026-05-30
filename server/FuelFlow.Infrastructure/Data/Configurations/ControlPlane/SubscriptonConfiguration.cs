using FuelFlow.Domain.Entities;
using FuelFlow.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FuelFlow.Infrastructure.Data.Configurations.ControlPlane;

/// <summary>
/// EF Core config for Subscription. user_id â†’ AspNetUsers (AppUser); plan_id â†’ subscription_plans.
/// </summary>
public class SubscriptionConfiguration : IEntityTypeConfiguration<Subscription>
{
    public void Configure(EntityTypeBuilder<Subscription> builder)
    {
        // 1. Table & key
        builder.ToTable("subscriptions");

        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id)
            .HasColumnName("id")
            .HasDefaultValueSql("gen_random_uuid()");

        // 2. Non-FK properties
        builder.Property(s => s.Status)
            .HasColumnName("status")
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(s => s.StartedAt)
            .HasColumnName("started_at");

        builder.Property(s => s.EndsAt)
            .HasColumnName("ends_at");

        builder.Property(s => s.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("NOW()");

        builder.Property(s => s.UpdatedAt)
            .HasColumnName("updated_at")
            .HasDefaultValueSql("NOW()");

        // 3. Relationships (FK property with its relationship block)

        // Relationship: Subscription â†’ AppUser (many-to-one)
        // On delete cascade: if user is deleted, their subscriptions are removed
        builder.Property(s => s.UserId)
            .HasColumnName("user_id")
            .IsRequired();
        builder.HasOne<AppUser>()
            .WithMany()
            .HasForeignKey(s => s.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Relationship: Subscription â†’ SubscriptionPlans (many-to-one)
        // On delete cascade: if plan is deleted, its subscriptions go too
        builder.Property(s => s.PlanId)
            .HasColumnName("plan_id")
            .IsRequired();
        builder.HasOne(s => s.Plan)
            .WithMany(p => p.Subscriptions)
            .HasForeignKey(s => s.PlanId)
            .OnDelete(DeleteBehavior.Cascade);

        // 4. Indexes
        // Index for fast lookups by user
        builder.HasIndex(s => s.UserId);
        // Index for fast lookups by plan
        builder.HasIndex(s => s.PlanId);

        // 5. Ignore (domain navigation; persistence uses AppUser)
        builder.Ignore(s => s.User);
    }
}
