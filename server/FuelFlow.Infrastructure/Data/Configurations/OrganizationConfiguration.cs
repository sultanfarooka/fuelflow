using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FuelFlow.Domain.Entities;

namespace FuelFlow.Infrastructure.Data.Configurations;

/// <summary>
/// EF Core Fluent API configuration for the Organization entity.
/// 
/// WHY Fluent API instead of [Table]/[Column] attributes on the entity?
/// - Keeps Domain entities clean (no EF Core dependency)
/// - All database-specific config lives in Infrastructure (where it belongs)
/// - More powerful than attributes (can configure complex relationships, indexes)
/// 
/// HOW: EF Core calls Configure() during migration generation.
/// It reads these rules and generates the correct CREATE TABLE SQL.
/// </summary>
public class OrganizationConfiguration : IEntityTypeConfiguration<Organization>
{
    public void Configure(EntityTypeBuilder<Organization> builder)
    {
        // Table name: snake_case (PRD convention)
        builder.ToTable("organizations");

        // Primary key
        builder.HasKey(o => o.Id);
        builder.Property(o => o.Id)
            .HasColumnName("id")
            .HasDefaultValueSql("gen_random_uuid()");

        // Properties with snake_case column names
        builder.Property(o => o.Name)
            .HasColumnName("name")
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(o => o.Email)
            .HasColumnName("email")
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(o => o.Phone)
            .HasColumnName("phone")
            .HasMaxLength(20);

        builder.Property(o => o.SubscriptionStatus)
            .HasColumnName("subscription_status")
            .HasConversion<string>()     // Store enum as string in DB
            .HasMaxLength(20)
            .HasDefaultValue(Domain.Enums.SubscriptionStatus.Trial);

        builder.Property(o => o.TrialEndsAt)
            .HasColumnName("trial_ends_at");

        builder.Property(o => o.RegisteredAt)
            .HasColumnName("registered_at")
            .HasDefaultValueSql("NOW()");

        builder.Property(o => o.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("NOW()");

        builder.Property(o => o.UpdatedAt)
            .HasColumnName("updated_at")
            .HasDefaultValueSql("NOW()");

        // Indexes
        builder.HasIndex(o => o.Email).IsUnique();
    }
}
