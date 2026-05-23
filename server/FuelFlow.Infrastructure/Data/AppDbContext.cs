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
    public DbSet<PhoneVerification> PhoneVerifications => Set<PhoneVerification>();
    public DbSet<UserStation> UserStations => Set<UserStation>();
    public DbSet<Subscription> Subscriptions => Set<Subscription>();
    public DbSet<SubscriptionPlans> SubscriptionPlans => Set<SubscriptionPlans>();
    public DbSet<FuelTank> FuelTanks => Set<FuelTank>();
    public DbSet<FuelType> FuelTypes => Set<FuelType>();
    public DbSet<OMC> OMCs => Set<OMC>();
    public DbSet<OMCFuelTypes> OMCFuelTypes => Set<OMCFuelTypes>();
    public DbSet<FuelPrices> FuelPrices => Set<FuelPrices>();
    public DbSet<FuelNozzle> FuelNozzles => Set<FuelNozzle>();
    public DbSet<StationShift> StationShifts => Set<StationShift>();
    public DbSet<ShiftAssignment> ShiftAssignments => Set<ShiftAssignment>();
    public DbSet<NozzleReadings> NozzleReadings => Set<NozzleReadings>();
    public DbSet<FuelTankReading> FuelTankReadings => Set<FuelTankReading>();
    public DbSet<DipChart> DipCharts => Set<DipChart>();
    public DbSet<DipChartEntry> DipChartEntries => Set<DipChartEntry>();

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

        // Domain User is discovered via other entities; AssignedStations is populated in app layer from user_stations junction
        modelBuilder.Entity<User>().Ignore(u => u.AssignedStations);
        modelBuilder.Entity<User>().Ignore(u => u.Subscriptions);
    }
}
