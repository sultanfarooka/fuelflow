# FuelFlow.Domain — Pure Domain Model

The innermost layer. Zero external dependencies. Contains entities, enums, and business rules expressed as plain C#.

**Dependencies:** None. Zero NuGet packages. If Domain needs a package, the design is wrong.

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
│   │   ├── Station.cs               # Filling station (Name, Address, OrganizationId, OMCId)
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
