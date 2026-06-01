# FuelFlow.Infrastructure

Implements all Application layer interfaces. This is where data access, external services, and CQRS handlers live. ~70% of backend implementation work happens here.

## Directory Structure

```
FuelFlow.Infrastructure/
├── DependencyInjection.cs          # Registers all infra services (single entry point)
├── Data/
│   ├── AppDbContext.cs             # IdentityDbContext<AppUser, AppRole, Guid>
│   ├── Configurations/            # EF Fluent API entity mappings (one per entity)
│   ├── DataSeeder.cs              # Idempotent startup seeder (OMCs, plans, roles)
│   ├── SeedData.cs                # Static seed data definitions
│   └── UserStation.cs             # Junction table model (UserId, StationId)
├── Features/                      # CQRS handlers (mirrors Application/Features/)
│   ├── Auth/Commands/             # 8 command handlers
│   ├── Auth/Queries/              # 1 query handler
│   ├── Station/                   # Create, GetByOrg
│   ├── FuelTank/                  # Create, GetByStation
│   ├── FuelType/                  # Create, Delete, GetByStation
│   ├── FuelNozzle/                # Create, GetByStation
│   ├── FuelPrices/                # Set, GetByStation
│   ├── OMC/                       # Create, GetAll
│   ├── OMCFuelType/               # Create, GetAll
│   ├── StationShift/              # Open, Close, GetOpen, GetByStation
│   ├── ShiftAssignment/           # Create, GetByShift
│   └── Onboarding/                # Onboarding handler
├── Identity/
│   ├── AppUser.cs                 # Extends IdentityUser<Guid> (FullName, PinHash, OrganizationId)
│   └── AppRole.cs                 # Extends IdentityRole<Guid>
├── Migrations/                    # EF Core migrations (never edit after creation)
├── Repositories/                  # One per entity + UnitOfWork
│   ├── OrganizationRepository.cs
│   ├── StationRepository.cs
│   ├── FuelTankRepository.cs
│   ├── FuelTypeRepository.cs
│   ├── FuelPricesRepository.cs
│   ├── FuelNozzleRepository.cs
│   ├── StationShiftRepository.cs
│   ├── ShiftAssignmentRepository.cs
│   ├── OMC-Repository.cs
│   ├── OMC-FuelTypeRepository.cs
│   ├── UserStationRepository.cs
│   ├── SubscriptionRepository.cs
│   ├── SubscriptionPlanRepository.cs
│   ├── RefreshTokenRepository.cs
│   └── UnitOfWork.cs              # BeginTransaction, Commit, Rollback, SaveChanges
└── Services/
    ├── AuthService.cs             # Verification/reset email sending
    ├── JwtTokenService.cs         # JWT generation, refresh token hashing (SHA256)
    ├── CurrentUserService.cs      # Extracts current user from JWT claims
    ├── RequestContextService.cs   # ClientIp, UserAgent extraction
    └── SmtpEmailSender.cs         # MailKit with Gmail SMTP
```

## EF Core Configuration Conventions (Builder Pattern)

Each entity gets one `IEntityTypeConfiguration<T>` class in `Data/Configurations/`.

### Section Order Inside `Configure()`

Follow this order strictly for consistency across all configurations:

1. **Table & Key** — `ToTable()`, `HasKey()`
2. **Non-FK Properties** — `Property()` for columns, `HasColumnName()`, `IsRequired()`, `HasMaxLength()`, etc.
3. **Relationships** — Each as one block: comment -> FK Property -> HasOne/WithMany
4. **Indexes** — With comments explaining purpose
5. **Ignore** — If any domain navigations are not mapped

### Relationship Comment Convention

Always state the relationship type and delete behavior:

```csharp
// Relationship: FuelTank -> FuelType (many-to-one)
// On delete cascade: if fuel type is deleted, its tanks go too
```

### FK Property Placement

Keep the FK property definition together with its relationship block — never scatter FK definitions:

```csharp
// Relationship: FuelNozzle -> FuelTank (many-to-one)
// On delete cascade: if tank is deleted, its nozzles go too
builder.Property(n => n.TankId)
    .HasColumnName("tank_id")
    .IsRequired();
builder.HasOne(n => n.FuelTank)
    .WithMany()
    .HasForeignKey(n => n.TankId)
    .OnDelete(DeleteBehavior.Cascade);
```

### Index Comments

Add short, descriptive comments before each index:

```csharp
// Index for fast lookups by station
builder.HasIndex(f => f.StationId);

// Composite index for price history lookups (station + fuel type + effective from)
builder.HasIndex(p => new { p.StationId, p.FuelTypeId, p.EffectiveFrom });
```

### Relationship Type Quick Reference

| Type | Pattern | Example |
|------|---------|---------|
| **Many-to-one** | `HasOne(...).WithMany()` | Many FuelTanks -> one FuelType |
| **One-to-one** | `HasOne(...).WithOne(...)` | One FuelTank <-> one DipChart |
| **One-to-many** | FK on many side | One Station -> many FuelTanks |

When FK is on the other entity (e.g., DipChart has TankId), note it: `(one-to-one, FK on DipChart)`.

### Reference Implementations

Follow these as canonical examples: `FuelTankConfiguration.cs`, `FuelNozzleConfiguration.cs`, `FuelPricesConfiguration.cs`, `FuelTypeConfiguration.cs`, `StationShiftConfiguration.cs`.

## Handler Implementation Pattern (SRP + Mediator)

Each handler has a single responsibility: process one command or query.

```csharp
public class CreateStationCommandHandler : IRequestHandler<CreateStationCommand, Result<CreateStationResponse>>
{
    private readonly IStationRepository _stationRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly IUnitOfWork _unitOfWork;

    public CreateStationCommandHandler(
        IStationRepository stationRepository,
        ICurrentUserService currentUserService,
        IUnitOfWork unitOfWork)
    {
        _stationRepository = stationRepository;
        _currentUserService = currentUserService;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<CreateStationResponse>> Handle(
        CreateStationCommand request, CancellationToken ct)
    {
        // 1. Get current user context
        // 2. Validate business rules (plan limits, permissions)
        // 3. Create entity from request DTO
        // 4. Persist via repository
        // 5. Return Result<T>.Success(response) or Result<T>.Fail(error)
    }
}
```

**Rules:**
- Always async/await for DB operations
- Always inject dependencies via constructor (Dependency Inversion)
- Always return `Result<T>` — never throw for expected business failures
- Always apply multi-tenancy filtering (StationId) in queries
- Always use `IUnitOfWork` for operations that span multiple repositories

## Repository Pattern (Data Access Abstraction)

Interface defined in `Application/Interfaces/Repositories/`. Implementation here injects `AppDbContext`.

```csharp
// Each repository is focused (Interface Segregation) — only methods that entity needs
public interface IStationRepository
{
    Task<Station?> GetByIdAsync(Guid id);
    Task<List<Station>> GetByOrganizationIdAsync(Guid orgId);
    Task<int> CountByOrganizationIdAsync(Guid orgId);
    Task AddAsync(Station station);
}
```

**UnitOfWork** manages transaction boundaries:
- `BeginTransactionAsync()` — start explicit transaction
- `CommitAsync()` — commit transaction
- `RollbackAsync()` — rollback on failure
- `SaveChangesAsync()` — persist changes without explicit transaction

## DependencyInjection.cs

Single extension method `AddInfrastructure(IServiceCollection, IConfiguration)` registers:

1. **DbContext** — PostgreSQL via Npgsql
2. **ASP.NET Identity** — AppUser/AppRole with Guid keys, password rules (min 6, digit required), lockout (5 attempts, 5 min), unique email, 24h token expiry
3. **Repositories** — All 14 as Scoped
4. **Services** — AuthService, JwtTokenService, CurrentUserService, RequestContextService, SmtpEmailSender
5. **MediatR** — Assembly scanning for handler auto-registration
6. **DataSeeder** — `IHostedService` for idempotent startup seeding (OMCs, fuel types, subscription plans, roles)

## Migrations

- **Create:** `./db-migration-add.ps1 <MigrationName>` (or `dotnet ef migrations add <Name> --project FuelFlow.Infrastructure --startup-project FuelFlow.Api`)
- **Apply:** `./db-update.ps1` (or `dotnet ef database update --project FuelFlow.Infrastructure --startup-project FuelFlow.Api`)
- **Never** edit migration files after creation
- **Never** remove applied migrations — create new ones to fix issues
- Test migrations on staging before production

## Design Patterns Summary

| Pattern | Implementation | Principle |
|---------|---------------|-----------|
| **Repository** | `{Entity}Repository` wraps `AppDbContext` | DIP: business logic depends on interface, not EF Core |
| **Unit of Work** | `UnitOfWork` manages `DbContext` transactions | SRP: transaction management separate from data access |
| **Builder** | EF Fluent API `IEntityTypeConfiguration<T>` | Declarative, readable entity-to-table mapping |
| **Mediator** | MediatR handlers auto-discovered from assembly | OCP: new features = new handlers, no existing code changes |
| **Strategy** | `DataSeeder` with idempotent seed methods | OCP: add new seed data without modifying existing seeds |

## Important DB Rules (Cross-Cutting)

These invariants are enforced at the data-access layer (configurations, repository discipline, or handler-level checks). Migrations are the schema source of truth — when a rule and code disagree, code wins; update this list.

| Area | Rule | Enforcement |
|---|---|---|
| Refresh tokens | Store hashed only; plain token sent to client only at creation | `RefreshTokenConfiguration` indexes `TokenHash`; service hashes before save |
| Refresh tokens | Rotation on refresh: each refresh issues a new token, revokes the old; reuse ⇒ revoke chain | `RefreshTokenService.RefreshAsync` |
| Refresh tokens | 7-day default expiry; session metadata (`ip_address`, `user_agent`, `device_id`) per row | Captured by `RequestContextService` |
| Multi-tenancy | Two-context split: control plane vs per-tenant (M14-F01). See "Control Plane vs PerTenant Context" below. | `ControlPlaneDbContext` + `AppDbContext` registered side by side in `DependencyInjection.cs` with separate `MigrationsHistoryTable` names |
| Cross-context refs | Plain `Guid` columns only — no FK constraints between DbContexts. App-layer enforces existence via the correctly-routed repo before insert/update. | `Organization.OwnerId`, `UserStation.UserId`, `Subscription.UserId` (intra-CP), plus F01 shims for FuelTank.FuelTypeId / Station.OMCId / FuelPrices.FuelTypeId (TODO M14-F03) |
| Subscriptions | Exactly one **active** subscription per organisation | Unique partial index on `Subscription(organizationId)` where `status = 'active'` (control plane) |
| Pricing | Exactly one active `FuelPrices` per `(stationId, fuelTypeId)` at any time | Application-level check in handler + index on `(stationId, fuelTypeId, effectiveFrom)` (per-tenant) |
| Shifts | At most one open `StationShift` per `stationId` | Application-level check in `OpenShiftCommandHandler` |
| Audit | Audit rows are append-only — no delete | Configured at the repo level: no `Delete` method on `IAuditLogRepository` |

> Cross-reference: every rule above is also tracked in [`docs/MODULES.md`](../../docs/MODULES.md) with its `MXX-FXX-RXX` ID, status, and acceptance criteria. Use the module file for *what should exist*; use this file for *how it's enforced in EF Core*.

## Control Plane vs PerTenant Context (Multi-Tenancy — M14-F01)

Tenant isolation is enforced by **physical context separation**: each entity belongs to exactly one `DbContext` and the application-layer routing ensures a query for tenant data only ever travels through `AppDbContext`. There are no EF Core global query filters in M14-F01 (the previous aspirational filter pattern documented here was never implemented; M14-F01 supersedes it with a stronger guarantee).

### Two contexts, side by side

```csharp
// server/FuelFlow.Infrastructure/DependencyInjection.cs
var connStr = configuration.GetConnectionString("DefaultConnection");

services.AddDbContext<ControlPlaneDbContext>(options =>
    options.UseNpgsql(connStr,
        npgsql => npgsql.MigrationsHistoryTable("__EFMigrationsHistory_ControlPlane")));

services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connStr,
        npgsql => npgsql.MigrationsHistoryTable("__EFMigrationsHistory_AppDb")));

services.AddIdentity<AppUser, AppRole>(/* … */)
    .AddEntityFrameworkStores<ControlPlaneDbContext>()   // Identity now lives in control plane
    .AddDefaultTokenProviders();
```

| Context | Configurations folder | DbSets |
|---|---|---|
| `ControlPlaneDbContext` extends `IdentityDbContext<AppUser, AppRole, Guid>` | `Data/Configurations/ControlPlane/` | `AspNetUsers` (via Identity), `Tenants`, `RefreshTokens`, `PhoneVerifications`, `Subscriptions`, `SubscriptionPlans`, `OMCs`, `OMCFuelTypes`, `FuelTypes` |
| `AppDbContext` extends plain `DbContext` | `Data/Configurations/PerTenant/` | `Organizations`, `Stations`, `UserStations`, `FuelTanks`, `FuelNozzles`, `FuelPrices`, `StationShifts`, `ShiftAssignments`, `NozzleReadings`, `FuelTankReadings`, `DipCharts`, `DipChartEntries`, `StationShiftConfigs`, `BankAccounts` |

Each context's `OnModelCreating` filters `ApplyConfigurationsFromAssembly` by namespace so configurations land in exactly one model.

### M14-F01 shim — same physical DB, dual model registration

Three navs survive M14-F01 as cross-context shims so existing `.Include(...)` calls continue to work:
- `FuelTank.FuelType`
- `Station.OMC`
- `FuelPrices.FuelType`

AppDbContext applies the FuelType/OMC/OMCFuelType configurations explicitly and marks the tables `ExcludeFromMigrations`. ControlPlaneDbContext owns the migrations for those tables; AppDbContext just reads from them at query time:

```csharp
// AppDbContext.OnModelCreating
modelBuilder.ApplyConfigurationsFromAssembly(
    typeof(AppDbContext).Assembly,
    t => t.Namespace == "FuelFlow.Infrastructure.Data.Configurations.PerTenant");

// TODO M14-F03: drop these once tenant DBs split (handlers will do lookups via IFuelTypeRepository / IOMCRepository instead).
modelBuilder.ApplyConfiguration(new Configurations.ControlPlane.FuelTypeConfiguration());
modelBuilder.ApplyConfiguration(new Configurations.ControlPlane.OMCConfiguration());
modelBuilder.ApplyConfiguration(new Configurations.ControlPlane.OMCFuelTypeConfiguration());
modelBuilder.Entity<FuelType>().ToTable("fuel_types", t => t.ExcludeFromMigrations());
modelBuilder.Entity<OMC>().ToTable("omcs", t => t.ExcludeFromMigrations());
modelBuilder.Entity<OMCFuelTypes>().ToTable("omc_fuel_types", t => t.ExcludeFromMigrations());
```

### Migrations are split

Two histories, two folders:

```
server/FuelFlow.Infrastructure/Migrations/
├── ControlPlane/                       ← ControlPlaneDbContextModelSnapshot.cs
│   └── <ts>_Initial.cs                 ← Identity + Tenants + Subscriptions + reference data
└── Tenant/                             ← AppDbContextModelSnapshot.cs
    └── <ts>_Initial.cs                 ← Organizations + operational tables (FuelTypes/OMCs ExcludeFromMigrations)
```

Migration tooling:
- `server/db-migration-add.ps1 -Name <Name> -Context <ControlPlane|Tenant>` — both parameters required (no default; picking the wrong context corrupts per-context history).
- `server/db-update.ps1 [-Context <Both|ControlPlane|Tenant>]` — default `Both`; ControlPlane runs first (its tables must exist before per-tenant references work).

### Repository routing — 7 control-plane vs 11 per-tenant

| Bound to `ControlPlaneDbContext` | Bound to `AppDbContext` |
|---|---|
| `RefreshTokenRepository` | `OrganizationRepository` |
| `PhoneVerificationRepository` | `StationRepository` |
| `SubscriptionRepository` | `FuelTankRepository` |
| `SubscriptionPlanRepository` | `FuelNozzleRepository` |
| `OMCRepository` | `FuelPricesRepository` |
| `OMCFuelTypeRepository` | `StationShiftRepository` |
| `FuelTypeRepository` | `ShiftAssignmentRepository` |
|  | `DipChartRepository` |
|  | `UserStationRepository` |
|  | `StationShiftConfigRepository` |
|  | `BankAccountRepository` |

Handlers inject repos by interface and never see which `DbContext` is doing the work. To add a new repository: pick the entity's context, inject the matching `DbContext` in the constructor, register the repo as `Scoped` in `DependencyInjection.cs`.

### `UnitOfWork` manages both contexts (with an F01 caveat)

```csharp
// SaveChangesAsync flushes AppDbContext first (so any newly-created Organization
// is visible to subsequent control-plane writes like AppUser.OrganizationId),
// then ControlPlaneDbContext.
public async Task SaveChangesAsync()
{
    await _appDbContext.SaveChangesAsync();
    await _controlPlaneDbContext.SaveChangesAsync();
}

// BeginTransactionAsync still opens on AppDbContext only — F01 limitation.
// Both contexts share the same physical Postgres database, so cross-context
// reads see committed AppDbContext changes; cross-context writes commit
// independently. TODO M14-F03: replace with an explicit saga + compensation
// when each tenant has its own physical DB and a single transaction can no
// longer span both.
public async Task BeginTransactionAsync()
{
    _transaction = await _appDbContext.Database.BeginTransactionAsync();
}
```

### What's coming in M14-F02 / M14-F03

- **M14-F02** introduces `ITenantConnectionResolver` + `AddDbContextFactory<AppDbContext>` so `AppDbContext`'s connection string is resolved per-request from the JWT `org_id` claim. 18 repos refactor to inject `IDbContextFactory<AppDbContext>`. `UnitOfWork` redesigns for factory-created contexts.
- **M14-F03** introduces `ITenantProvisioningService` (`CREATE DATABASE tenant_<org_id>` + run tenant migrations) and removes the F01 shims documented above. At that point the cross-context FuelType/OMC navs become impossible (no shared physical DB) — handlers do explicit lookups via control-plane repos.

### Rules

- **One context per entity.** Don't put an entity's DbSet in both contexts unless it's a deliberate cross-context shim (only the three M14-F01 shims qualify, all marked `ExcludeFromMigrations` on the AppDbContext side).
- **Cross-context refs are plain `Guid` columns, not FK navigation properties.** Use the control-plane repo's `ExistsAsync(userId)` (or similar) in handlers before inserting per-tenant rows that reference a control-plane row.
- **No `.Include(...)` across DbContexts.** The shim works for `FuelTank.FuelType` etc. in F01 only because of the shared physical DB. Don't add new cross-context Includes — they will break in M14-F03.
- **MigrationsHistoryTable names must stay separate** (`__EFMigrationsHistory_ControlPlane` vs `__EFMigrationsHistory_AppDb`). If two contexts ever share the same history table they will tramp each other's migration records.
- **`dotnet ef migrations add` requires `--context`.** Always pass `-Context ControlPlane` or `-Context Tenant` to the wrapper script. The script enforces this; raw `dotnet ef` defaults to the first context alphabetically (which is wrong half the time).
