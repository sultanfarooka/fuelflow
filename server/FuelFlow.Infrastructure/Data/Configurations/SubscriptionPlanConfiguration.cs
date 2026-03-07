using FuelFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FuelFlow.Infrastructure.Data.Configurations;

/// <summary>
/// EF Core config for SubscriptionPlans (reference data, seeded). One-to-many with Subscription.
/// </summary>
public class SubscriptionPlanConfiguration : IEntityTypeConfiguration<SubscriptionPlans>
{
    public void Configure(EntityTypeBuilder<SubscriptionPlans> builder)
    {
        // 1. Table & key
        builder.ToTable("subscription_plans");

        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id)
            .HasColumnName("id")
            .HasDefaultValueSql("gen_random_uuid()");

        // 2. Non-FK properties
        builder.Property(s => s.Name)
            .HasColumnName("name")
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(s => s.MaxStations)
            .HasColumnName("max_stations")
            .IsRequired();

        builder.Property(s => s.MaxUsers)
            .HasColumnName("max_users")
            .IsRequired();

        builder.Property(s => s.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("NOW()");

        builder.Property(s => s.UpdatedAt)
            .HasColumnName("updated_at")
            .HasDefaultValueSql("NOW()");

        // 3. Relationships (one-to-many: configured from the "one" side; FK on Subscription)
        // Relationship: SubscriptionPlans → Subscription (one-to-many)
        // On delete cascade: if plan is deleted, its subscriptions go too
        builder.HasMany(s => s.Subscriptions)
            .WithOne(s => s.Plan)
            .HasForeignKey(s => s.PlanId)
            .OnDelete(DeleteBehavior.Cascade);

        // 4. Indexes
        builder.HasIndex(s => s.Name);
        builder.HasIndex(s => s.MaxStations);
        builder.HasIndex(s => s.MaxUsers);

        // 5. Seed data: see DataSeeder (runs on startup, idempotent)
    }
}
