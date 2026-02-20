using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using FuelFlow.Domain.Entities;
using FuelFlow.Infrastructure.Identity;

namespace FuelFlow.Infrastructure.Data;

/// <summary>
/// The main database context — the bridge between C# and PostgreSQL.
/// 
/// WHY extend IdentityDbContext instead of plain DbContext?
/// - IdentityDbContext automatically adds tables for Identity:
///   AspNetUsers, AspNetRoles, AspNetUserRoles, AspNetUserClaims, etc.
/// - We get user management, password hashing, role assignment for FREE
/// - The generic parameters tell Identity to use our custom AppUser/AppRole with Guid keys
/// 
/// HOW it works:
/// - DbSet<T> properties define which entities become database tables
/// - OnModelCreating() configures HOW entities map to tables (names, relationships, indexes)
/// - EF Core reads these configs and generates SQL migrations
/// </summary>
public class AppDbContext : IdentityDbContext<AppUser, AppRole, Guid>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    // Our business tables (Identity tables like AspNetUsers are added automatically)
    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<Station> Stations => Set<Station>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    // Note: We do NOT add DbSet<User> (Domain entity) here.
    // Identity's AppUser IS our user table. The Domain User entity
    // is a business concept; AppUser is the persisted version.

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // IMPORTANT: Call base first — this configures all Identity tables
        base.OnModelCreating(modelBuilder);

        // Apply all entity configurations from this assembly
        // (reads all IEntityTypeConfiguration<T> classes from Data/Configurations/)
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}
