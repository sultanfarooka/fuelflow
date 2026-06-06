using FuelFlow.Domain.Entities;
using FuelFlow.Domain.Entities.StationEntities;
using Microsoft.EntityFrameworkCore;

namespace FuelFlow.Infrastructure.Data;

/// <summary>
/// The per-tenant operational database context (M14-F01).
///
/// HOLDS: <see cref="Organization"/> + every operational table that belongs to one
/// tenant's filling-station business — Stations, FuelTanks, FuelNozzles, FuelPrices,
/// StationShifts, ShiftAssignments, NozzleReadings, FuelTankReadings, DipChart,
/// DipChartEntry, StationShiftConfig, BankAccount, and the UserStation junction.
///
/// DOES NOT EXTEND IdentityDbContext (M14-F01 change): Identity tables and platform
/// reference data moved to <see cref="ControlPlaneDbContext"/>. The shared physical
/// Postgres database in F01 still contains both contexts' tables, but each context's
/// model owns its own subset.
///
/// CROSS-CONTEXT REFERENCES IN F01:
/// - <see cref="Organization.OwnerId"/> and <see cref="UserStation.UserId"/> point at
///   AspNetUsers rows in ControlPlaneDbContext but are stored as plain Guid columns
///   (no FK constraint at the EF model level). Handlers enforce existence via the
///   control-plane AppUser repository.
/// - <see cref="FuelTank.FuelType"/>, <see cref="Station.OMC"/>, and
///   <see cref="FuelPrices.FuelType"/> still have EF navigations into control-plane
///   entities. This works in F01 because both contexts target the same physical DB.
///   <b>F03 must remove these or replicate FuelType/OMC into tenant DBs.</b> The
///   FuelType, OMC, and OMCFuelTypes configurations are applied here with
///   <c>ExcludeFromMigrations</c> so AppDbContext can resolve the navs at query time
///   without trying to own those tables' migrations (ControlPlaneDbContext owns them).
/// </summary>
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<Station> Stations => Set<Station>();
    public DbSet<UserStation> UserStations => Set<UserStation>();
    public DbSet<FuelTank> FuelTanks => Set<FuelTank>();
    public DbSet<FuelNozzle> FuelNozzles => Set<FuelNozzle>();
    public DbSet<FuelPrices> FuelPrices => Set<FuelPrices>();
    public DbSet<StationShift> StationShifts => Set<StationShift>();
    public DbSet<ShiftAssignment> ShiftAssignments => Set<ShiftAssignment>();
    public DbSet<NozzleReadings> NozzleReadings => Set<NozzleReadings>();
    public DbSet<FuelTankReading> FuelTankReadings => Set<FuelTankReading>();
    public DbSet<DipChart> DipCharts => Set<DipChart>();
    public DbSet<DipChartEntry> DipChartEntries => Set<DipChartEntry>();
    public DbSet<StationShiftConfig> StationShiftConfigs => Set<StationShiftConfig>();
    public DbSet<BankAccount> BankAccounts => Set<BankAccount>();
    public DbSet<AccountHead> AccountHeads => Set<AccountHead>();
    public DbSet<FinancialEntry> FinancialEntries => Set<FinancialEntry>();
    // Removed in M14-F01 (moved to ControlPlaneDbContext): RefreshTokens,
    // PhoneVerifications, Subscriptions, SubscriptionPlans, OMCs, OMCFuelTypes,
    // FuelTypes. Identity tables (AspNetUsers etc.) likewise no longer live in
    // this context — see ControlPlaneDbContext.

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply only the per-tenant configurations.
        modelBuilder.ApplyConfigurationsFromAssembly(
            typeof(AppDbContext).Assembly,
            t => t.Namespace == "FuelFlow.Infrastructure.Data.Configurations.PerTenant");

        // M14-F02: F01 cross-context shims removed. FuelTank.FuelType, Station.OMC,
        // and FuelPrices.FuelType nav properties and HasOne configurations are dropped.
        // FK constraints dropped via DropCrossContextForeignKeys Tenant migration.
        // Handlers now use IFuelTypeRepository / IOMCRepository for explicit lookups.
    }
}
