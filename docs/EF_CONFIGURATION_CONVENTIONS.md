# EF Core Entity Configuration Conventions

Use this format for all `IEntityTypeConfiguration<T>` classes in `FuelFlow.Infrastructure/Data/Configurations/` so configurations stay consistent and easy to read.

---

## 1. Relationship comments

- **Always state the relationship type** in the comment: `(many-to-one)`, `(one-to-one)`, `(one-to-many)`.
- Add a second line for delete behavior or special notes when relevant.

Format:

```csharp
// Relationship: ThisEntity → OtherEntity (relationship-type)
// On delete cascade: brief reason (or other behavior / notes)
```

Examples:

- `// Relationship: FuelTank → FuelType (many-to-one)`
- `// Relationship: FuelTank ↔ DipChart (one-to-one, FK on DipChart)`
- `// Relationship: FuelType → Station (many-to-one, optional)`

---

## 2. Keep FK property with its relationship block

Put the **foreign key property** (`builder.Property(e => e.SomeId)`) in the **same block** as the relationship that uses it: comment → Property → HasOne/WithMany.

**Do this:**

```csharp
// Relationship: FuelNozzle → FuelTank (many-to-one)
// On delete cascade: if tank is deleted, its nozzles go too
builder.Property(n => n.TankId)
    .HasColumnName("tank_id")
    .IsRequired();
builder.HasOne(n => n.FuelTank)
    .WithMany()
    .HasForeignKey(n => n.TankId)
    .OnDelete(DeleteBehavior.Cascade);
```

**Avoid:** defining all FK properties at the top and relationships later; keep each FK with its relationship.

---

## 3. Index comments

Add a short comment before each index:

```csharp
// Index for fast lookups by station
builder.HasIndex(f => f.StationId);
// Index for fast lookups by fuel type
builder.HasIndex(f => f.FuelTypeId);
```

For composite indexes, describe the use:

```csharp
// Index for price history lookups (station + fuel type + effective from)
builder.HasIndex(p => new { p.StationId, p.FuelTypeId, p.EffectiveFrom });
```

---

## 4. Section order inside `Configure()`

1. **Table & key** – `ToTable`, `HasKey`, `Property(Id)` with column and default.
2. **Non-FK properties** – name, scalars, `CreatedAt`/`UpdatedAt`, etc.
3. **Relationships** – each as one block: comment(s) → FK Property → HasOne/WithMany/WithOne.
4. **Indexes** – each with a comment.
5. **Ignore** (if any) – e.g. domain navigations not mapped to DB.

---

## 5. Relationship type quick reference

| Relationship type | Example                         | Config pattern              |
|-------------------|---------------------------------|-----------------------------|
| Many-to-one       | Many FuelTanks → one FuelType  | `HasOne(...).WithMany()`    |
| One-to-one        | One FuelTank ↔ one DipChart    | `HasOne(...).WithOne(...)`  |
| One-to-many       | One Station → many FuelTanks   | Configured from the “one” or “many” side; FK on the many side. |

When the FK is on the **other** entity (e.g. DipChart has `TankId`), say so in the comment: `(one-to-one, FK on DipChart)`.

---

## 6. Example: full relationship block (many-to-one)

```csharp
// Relationship: FuelPrices → Station (many-to-one)
// On delete cascade: if station is deleted, its fuel prices go too
builder.Property(p => p.StationId)
    .HasColumnName("station_id")
    .IsRequired();
builder.HasOne(p => p.Station)
    .WithMany(s => s.FuelPrices)
    .HasForeignKey(p => p.StationId)
    .OnDelete(DeleteBehavior.Cascade);
```

Reference implementations: `FuelTankConfiguration.cs`, `FuelNozzleConfiguration.cs`, `FuelPricesConfiguration.cs`, `FuelTypeConfiguration.cs`, `StationShiftConfiguration.cs`.
