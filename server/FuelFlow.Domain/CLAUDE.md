# FuelFlow.Domain — Pure Domain Model

The innermost layer. Zero external dependencies. Contains entities, enums, and business rules expressed as plain C#.

**Dependencies:** None. Zero NuGet packages. If Domain needs a package, the design is wrong.

## Entity-Relationship Overview

High-level relationships between the main aggregates. Exact column types, indexes, and constraints live in EF Core migrations (`FuelFlow.Infrastructure/Migrations/`) — that's the schema source of truth.

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│ Organization │──1:N──│   Station    │──1:N──│   FuelTank   │
└──────┬───────┘       └──────┬───────┘       └──────┬───────┘
       │1:1                   │1:N                   │1:N
       ▼                      ▼                      ▼
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│ Subscription │       │     User     │       │  FuelNozzle  │
└──────┬───────┘       └──────┬───────┘       └──────┬───────┘
       │N:1                   │1:N                   │1:N
       ▼                      ▼                      ▼
┌──────────────────┐    ┌──────────────┐       ┌─────────────────┐
│SubscriptionPlans │    │ StationShift │──1:N──│ NozzleReadings  │
└──────────────────┘    └──────┬───────┘       └─────────────────┘
                               │1:N
                               ▼
                        ┌──────────────────┐
                        │ ShiftAssignment  │
                        └──────────────────┘
```

`RefreshToken` belongs to `User` (1:N). `FuelPrices` is per-station per-fuel-type with effective-date history. `DipChart` / `DipChartEntry` hangs off `FuelTank`. `OMC` and `OMC-FuelTypes` are independent reference data shared across stations.

## Key Entities (Conceptual)

The columns shown are the meaningful business fields — every entity also has `Id`, `CreatedAt`, `UpdatedAt` via `BaseEntity`. EF Core's `AspNetUsers` table backs the domain `User` entity; do not duplicate identity columns.

**Two-context split since M14-F01.** The `Ctx` column shows which `DbContext` owns each entity at the EF level:
- **CP** = `ControlPlaneDbContext` (Identity + platform reference data + Tenants registry)
- **PT** = `AppDbContext` (per-tenant operational data — what `AppDbContext` will route to a tenant DB once M14-F03 lands)

| Entity | Ctx | Key Fields | Notes |
|---|---|---|---|
| `Tenant` | CP | databaseName, status, provisionedAt | M14-F01 registry. `Id == Organization.Id` by app convention (no FK). Status: `Provisioning` / `Active` / `Suspended` / `Deleted`. |
| `Organization` | PT | name, ownerId | Root per-tenant business record. `ownerId` is a plain `Guid` (cross-context → AppUser; no FK). |
| `Subscription` | CP | userId, planId, status, startedAt, endsAt | One **active** subscription per org ([M11-F01-R01](../../docs/MODULES.md#m11-f01--subscription-plans)). |
| `SubscriptionPlans` | CP | name, maxStations, maxUsers, price, features (JSONB) | Seeded: Starter / Professional / Enterprise. |
| `Station` | PT | organizationId, name, address, omcId, isActive | Per-tenant. `omcId` is an F01-shim cross-context nav to control-plane `OMC` (F01 shim — kept for backwards compat; use IOMCRepository for new lookups). |
| `User` (`AspNetUsers`) | CP | email, fullName, phone, role, organizationId | Identity extension; `phone` validated `+92XXXXXXXXXX`. `organizationId` is a plain Guid (cross-context to `Organization`). |
| `RefreshToken` | CP | userId, tokenHash, expiresAt, revokedAt, ip, userAgent, deviceId | Hashed only — plain token sent at creation. Rotation on refresh; reuse ⇒ revoke chain. |
| `PhoneVerification` | CP | userId, code, expiresAt, attempts | OTP records; targets pre-org-creation flows so it must live in control plane. |
| `UserStation` (many-to-many) | PT | userId, stationId | Manager → station assignments ([M01-F07](../../docs/MODULES.md#m01-f07--multi-station-access)). `userId` is a plain Guid (no FK to control-plane AppUser). |
| `FuelTank` | PT | stationId, fuelTypeId, capacityLiters, name | Tank name unique per station. `fuelTypeId` is an F01-shim cross-context nav (F01 shim — kept for backwards compat; use IFuelTypeRepository for new lookups). |
| `FuelType` | CP | name, unit, isCustom, stationId? | Platform reference data (PMG, HSD, HOBC). `stationId` is a Guid? (no nav after M14-F01 — was cross-context). |
| `FuelNozzle` | PT | stationId, tankId, nozzleNumber, isActive | Unique per station; nozzle linked to one tank. |
| `FuelPrices` | PT | stationId, fuelTypeId, price, effectiveFrom | Only one active per (station, fuel) at a time ([M06-F01-R01](../../docs/MODULES.md#m06-f01--price-configuration)). `fuelTypeId` is an F01-shim cross-context nav (F01 shim — kept for backwards compat; use IFuelTypeRepository for new lookups). |
| `StationShift` | PT | stationId, status (Open/Closed), openedAt, closedAt, cash totals | One open per station ([M04-F03-R01](../../docs/MODULES.md#m04-f03--open-shift)). `openedByUserId`/`closedByUserId` are plain Guids (no FK to AppUser). |
| `ShiftAssignment` | PT | shiftId, userId, nozzleId | Who worked which nozzle. `userId` is plain Guid (no FK to AppUser). |
| `NozzleReadings` | PT | shiftId, nozzleId, readingType (Opening/Closing), totalizerValue, imageUrl | Closing ≥ Opening enforced in handler ([M03-F02-R04](../../docs/MODULES.md#m03-f02--meter-reading-entry)). `recordedByUserId` plain Guid. |
| `FuelTankReading` (Dip) | PT | shiftId, tankId, mm, computedLiters | Required at shift open + close. `recordedByUserId` plain Guid. |
| `DipChart` / `DipChartEntry` | PT | tankId, mm, liters | Per-tank mm → litres conversion table. |
| `OMC` | CP | name | Reference data: PSO, Shell, Total Parco, Attock, …  Reverse `Stations` collection dropped in M14-F01 (would pull per-tenant Stations into control-plane model). |
| `OMC-FuelTypes` | CP | omcId, fuelTypeId | Which fuels each OMC supplies. |
| `BankAccount` | PT | organizationId, bankName, accountNumber, accountTitle, isPrimary | One primary per org enforced at app layer. |
| `StationShiftConfig` | PT | stationId, shiftCount, shiftN names + start times | One-to-one with Station ([M12-F01](../../docs/MODULES.md#m12-f01--onboarding-wizard)). |

**Dropped navigation properties in M14-F01** (all cross-context refs — kept as plain `Guid` columns with app-layer enforcement):
- `Organization.Owner` (was → User), `UserStation.User` (was → AppUser)
- `OMC.Stations` (reverse collection — was → tenant Stations)
- `FuelType.Station` (was → tenant Station)
- The `HasOne<AppUser>()` FK declarations on `StationShift`, `FuelTankReading`, `NozzleReadings`, `ShiftAssignment`

**Kept as M14-F01 shims** (still work via the shared physical DB; drop in M14-F03 when DBs split):
- `FuelTank.FuelType` → control-plane FuelType
- `Station.OMC` → control-plane OMC
- `FuelPrices.FuelType` → control-plane FuelType

These are registered in `AppDbContext.OnModelCreating` with `ToTable(t => t.ExcludeFromMigrations())` so `AppDbContext` does not claim ownership of those tables' schema — `ControlPlaneDbContext` owns the migrations.

**Added in M12-F01 (Onboarding Wizard):**
- `StationShiftConfig` (in `StationEntities/`): `ShiftCount`, `Shift1Name`, `Shift1StartTime` (TimeSpan), `Shift2Name`, `Shift2StartTime`, `Shift3Name?`, `Shift3StartTime?`, `StationId`. One-to-one with `Station`.
- `BankAccount` (root `Entities/`): `OrganizationId`, `BankName`, `AccountNumber`, `AccountTitle`, `IsPrimary`. FK to `Organization`; global query filter by `OrganizationId`.
- `Station` entity gains `IsSetupComplete: bool` (default `false`) and `AcceptedPaymentMethods: List<string>` (JSONB, default `["Cash"]`).

Entities still to be added per the roadmap: `Customer`, `CreditTransaction`, `Supplier`, `SupplierPayment`, `Expense`, `ExpenseCategory`, `Product` (lubricants), `Notification`, `AuditLog`, `SubscriptionPayment`. See [M05](../../docs/MODULES.md#m05--finance--accounts), [M09](../../docs/MODULES.md#m09--lubricants--oil-shop), [M10](../../docs/MODULES.md#m10--sms--notifications), [M11-F03](../../docs/MODULES.md#m11-f03--payment--verification), [M01-F08](../../docs/MODULES.md#m01-f08--audit-trail).

## Directory Structure

```
FuelFlow.Domain/
├── Common/
│   └���─ BaseEntity.cs               # Abstract base: Id (Guid), CreatedAt, UpdatedAt
├── Entities/
│   ├── AuthEntities/
│   │   ├── User.cs                  # Domain user (FullName, Email, Phone, Role, IsActive)
│   │   └── RefreshToken.cs          # Token storage (TokenHash, ExpiresAt, DeviceId)
│   ├── StationEntities/
│   │   ├── Station.cs               # Filling station (Name, Address, OrganizationId, OMCId, IsSetupComplete, AcceptedPaymentMethods JSONB)
│   │   ├── StationShiftConfig.cs    # Per-station shift schedule (ShiftCount, Shift1-3 names + start times) [M12-F01]
│   │   ├── FuelTank.cs              # Tank (CapacityLiters, FuelTypeId, StationId)
│   │   ├── FuelType.cs              # Fuel variant (Name, Unit, IsCustom)
│   │   ├── FuelNozzle.cs            # Pump nozzle (NozzleNumber, TankId, IsActive)
│   │   ├── FuelPrices.cs            # Current prices (Price, EffectiveFrom)
│   │   ├── StationShift.cs          # Shift period (Status, OpenedAt, ClosedAt, cash totals)
│   │   ├── ShiftAssignment.cs       # Employee-to-nozzle assignment per shift
│   │   ├── NozzleReadings.cs        # Meter readings per nozzle
│   │   ├── FuelTankReading.cs       # Dip/meter readings per tank
│   │   ├── DipChart.cs              # Depth-to-volume conversion table
│   │   └── DipChartEntry.cs         # Individual dip chart row
│   ├── OMC-Entities/
│   │   ├── OMC.cs                   # Oil Marketing Company (PSO, Shell, Total, etc.)
│   │   └── OMC-FuelTypes.cs         # Fuel types offered by OMC
│   ├── Organization.cs              # Root tenant (Name, OwnerId)
│   ├── BankAccount.cs               # Org bank account (BankName, AccountNumber, AccountTitle, IsPrimary) [M12-F01]
│   ├── Subscription.cs              # Org subscription (PlanId, Status, StartedAt, EndsAt)
│   └── SubscriptionPlans.cs         # Plan tier (MaxStations, Price, Features JSONB)
└── Enums/
    ├── UserRole.cs                  # Owner, Manager, Nozzleman, Accountant, Custom
    ├── ShiftStatus.cs               # Open, Closed
    ├── ShiftNames.cs                # Morning, Evening, Night
    ├── ReadingType.cs               # Opening, Closing
    ├── SubscriptionStatus.cs        # Trial, Active, Expired, Cancelled
    └── SubscriptionPlanName.cs      # Starter, Professional, Enterprise
```

## Entity Rules (Liskov Substitution: All Entities Are Substitutable POCOs)

1. **Inherit from `BaseEntity`** — provides `Id` (Guid), `CreatedAt`, `UpdatedAt`
2. **No EF Core attributes** — no `[Table]`, `[Column]`, `[Key]`, `[Required]`, `[ForeignKey]`
3. **No framework references** — no `using Microsoft.EntityFrameworkCore`, no `using System.ComponentModel.DataAnnotations`
4. **Plain properties** — auto-properties with public get/set
5. **Navigation properties** — reference other entities for relationships (e.g., `public Organization? Organization { get; set; }`)
6. **Collection properties** — `ICollection<T>` for one-to-many (e.g., `public ICollection<Station> Stations { get; set; }`)
7. **Foreign keys as properties** — `public Guid StationId { get; set; }` alongside navigation property
8. **Computed properties** are allowed — pure logic only (e.g., `RefreshToken.IsActive => RevokedAt == null && DateTime.UtcNow <= ExpiresAt`)

## Entity Patterns

```csharp
// Typical entity — clean POCO
public class FuelTank : BaseEntity
{
    public string? Name { get; set; }
    public decimal CapacityLiters { get; set; }

    // Foreign keys + navigation
    public Guid FuelTypeId { get; set; }
    public FuelType FuelType { get; set; } = null!;
    public Guid StationId { get; set; }
    public Station Station { get; set; } = null!;

    // Collections
    public ICollection<FuelNozzle> FuelNozzles { get; set; } = new List<FuelNozzle>();
}
```

**Note:** EF Core mapping (column names, constraints, relationships, indexes) is done entirely in `Infrastructure/Data/Configurations/` via Fluent API.

## Enum Rules

- Use enums for all strongly-typed values (roles, statuses, types)
- Enum values are PascalCase
- Stored as strings in database (via EF Core `HasConversion<string>()` in Infrastructure)
- Add new values at the end to avoid breaking existing data

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Zero packages | Domain is reusable, testable, and framework-independent |
| No EF attributes | Mapping lives in Infrastructure — Domain doesn't know about persistence |
| `BaseEntity` with Guid | Global uniqueness, no auto-increment ordering issues |
| Navigation + FK properties | Enables both eager loading and direct FK queries |
| `ICollection<T>` for collections | EF Core compatible, doesn't leak implementation details |

## Adding a New Entity

1. Create class in appropriate subfolder under `Entities/`
2. Inherit from `BaseEntity`
3. Add properties (plain C# types, navigation properties, FK properties)
4. Add enum in `Enums/` if needed for strongly-typed values
5. Create `IEntityTypeConfiguration<T>` in `Infrastructure/Data/Configurations/`
6. Add `DbSet<T>` in `Infrastructure/Data/AppDbContext.cs`
7. Create migration via `db-migration-add.ps1`
