# Server — ASP.NET Core Backend

## Tech Stack

| Component | Tech | Version | Why |
|---|---|---|---|
| Framework | ASP.NET Core | 10.x | Web API, latest LTS-track, minimal hosting model |
| Language | C# | 12 | Records, primary constructors for terse Commands/Queries |
| ORM | Entity Framework Core | 10.x | Migrations + LINQ; better than Dapper for complex domain |
| Auth | ASP.NET Identity + JWT | — | Built-in user/role tables; JWT carried in HTTP-only cookies |
| CQRS / Messaging | MediatR | 14.x | In-process commands/queries; auto-discovered handlers; thin controllers |
| Validation | FluentValidation | 12.x | Reusable rule classes; cleaner than data annotations |
| Mapping | Mapperly | 4.3 | Source-generated mappers; zero runtime reflection |
| API Docs | Swagger / OpenAPI | — | Auto-generated from controllers; **endpoint SoT** |
| Background Jobs | Hangfire | 1.8.x | Dashboard + PostgreSQL-persisted jobs (planned for scheduled reports / trial expiry) |
| Logging | Serilog | 3.x | Structured logging; sinks for console + file + future log aggregator |
| Caching (optional) | Redis | — | Session/query cache; only if performance demands it |
| Database | PostgreSQL | 16.x | Open source, JSON support for flexible fields (dip charts, plan features), excellent for reporting queries, first-class AWS RDS support |

> Endpoint catalogue → **Swagger is the source of truth** (auto-generated from controllers at `/swagger`). The list in `server/FuelFlow.Api/CLAUDE.md` is a hand-maintained convenience index — verify against Swagger when in doubt.

## Clean Architecture (SOLID Foundation)

Four separate .NET projects. Dependencies flow inward only — inner layers never reference outer layers.

| Project | Role | Depends On | SOLID Mapping |
|---------|------|------------|---------------|
| **FuelFlow.Domain** | Entities, enums, business rules (pure C#, zero packages) | Nothing | Liskov Substitution: entities are substitutable POCOs |
| **FuelFlow.Application** | Commands, Queries, DTOs, validators, interfaces | Domain | Interface Segregation: focused interfaces (IAuthService, IStationRepository) |
| **FuelFlow.Infrastructure** | EF Core, handlers, repos, services, migrations | Application, Domain | Dependency Inversion: implements Application interfaces |
| **FuelFlow.Api** | Controllers, Program.cs (composition root) | Application, Infrastructure | Single Responsibility: thin controllers only dispatch |

> See `server/FuelFlow.Infrastructure/CLAUDE.md` for handler, repository, and EF Core conventions.

## Layer Rules

### Domain (`FuelFlow.Domain/`)
- **Zero NuGet packages** — pure C# only. If Domain needs a package, reconsider the design.
- Entities are POCOs — no `[Table]`, `[Column]`, or any EF Core attributes.
- `BaseEntity` provides: `Id` (Guid), `CreatedAt`, `UpdatedAt`.
- Enums for strongly-typed values: `UserRole`, `ShiftStatus`, `ShiftNames`, `ReadingType`, `SubscriptionStatus`, `SubscriptionPlanName`.
- Organized: `Entities/AuthEntities/`, `Entities/StationEntities/`, `Entities/OMC-Entities/`, `Enums/`.

### Application (`FuelFlow.Application/`)
- **Commands** = state-changing operations. **Queries** = read-only operations.
- Both are records implementing `IRequest<Result<T>>` (MediatR).
- Interfaces defined here, implemented in Infrastructure (Dependency Inversion).
- `Result<T>` in `Common/` — explicit success/failure, no exceptions for business logic.
- DTOs for all request/response — organized by feature under `DTOs/`.
- FluentValidation validators in `Validators/` — one per request DTO.
- Feature folders: `Features/{Feature}/Commands/` and `Features/{Feature}/Queries/`.

### Infrastructure (`FuelFlow.Infrastructure/`)
- Implements all Application interfaces (repositories, services).
- `DependencyInjection.cs` registers everything via `AddInfrastructure()` extension.
- Handlers live here, not in Application — they need data access (see Infrastructure CLAUDE.md).

### Api (`FuelFlow.Api/`)
- **Composition root** — the only project that knows about all layers.
- Controllers are thin (SRP): only `await _mediator.Send(command)` — no business logic.
- `[Authorize]` and `[Authorize(Roles = "Owner,Manager")]` for access control.
- `Program.cs` wires: Serilog, Infrastructure DI, JWT auth, FluentValidation auto-validation, CORS, Swagger, controllers with camelCase JSON.
- Returns `{ success: true, data: {...} }` on success; RFC 7807 Problem Details on error.

## CQRS + MediatR (Mediator Pattern)

Controllers dispatch via `IMediator` — never call handlers directly.

```csharp
// Application — Command definition (SRP: one command, one purpose)
public record LoginCommand(LoginRequest Request) : IRequest<Result<AuthResponse>>;

// Application — Query definition
public record GetCurrentUserQuery(Guid UserId) : IRequest<Result<AuthResponse>>;

// Infrastructure — Handler (SRP: one handler, one operation)
public class LoginCommandHandler : IRequestHandler<LoginCommand, Result<AuthResponse>>
{
    public async Task<Result<AuthResponse>> Handle(LoginCommand request, CancellationToken ct)
    {
        // Business logic here — inject repos/services via constructor
        return Result<AuthResponse>.Success(authResponse);
    }
}

// Api — Controller (thin, only dispatches)
var result = await _mediator.Send(new LoginCommand(request));
if (!result.IsSuccess) return Unauthorized(new { error = result.Error });
return Ok(new { success = true, data = result.Data });
```

## API Conventions

- **Base URL:** `/api/v1`
- **Format:** JSON with camelCase serialization
- **Auth:** JWT via HTTP-only cookies (`access_token`, `refresh_token`). Client sends `credentials: include`. Tokens never appear in JSON responses.
- **Errors:** RFC 7807 Problem Details
- **Pagination:** `?page=1&pageSize=20`
- **Sorting:** `?sortBy=name&sortOrder=asc`
- **Filtering:** `?status=active&search=xyz`
- **Response format:**
```json
{ "success": true, "data": { ... }, "errors": null }
```

## Database Conventions

- **Tables:** `snake_case` (e.g., `fuel_types`, `meter_readings`)
- **Primary Keys:** `id` (UUID via `gen_random_uuid()`)
- **Foreign Keys:** `{entity}_id` (e.g., `station_id`, `tank_id`)
- **Timestamps:** `created_at`, `updated_at` (TIMESTAMPTZ)
- **Soft Deletes:** `is_active` BOOLEAN preferred over hard deletes
- **Multi-tenancy:** EF Core global query filters on `StationId`. Always include `StationId` in queries except Owner consolidated views.
- **Entity hierarchy:** `organizations` -> `stations` -> `tanks`, `nozzles`, `users`, `shifts` -> `meter_readings`, `dip_readings`

```csharp
// Multi-tenant query — always filter by station (Open/Closed Principle: filters extend, don't modify)
var tanks = await _repository.GetAll()
    .Where(t => t.StationId == currentStationId)
    .ToListAsync();

// Owner bypasses station filter for consolidated view
if (user.Role == "owner")
    tanks = await _repository.GetAll().ToListAsync();
```

## Authentication Implementation

- **JWT in HTTP-only cookies** — not Authorization header. `AuthCookieOptions.cs` builds cookie config (Secure in prod, SameSite=Lax).
- **Claims:** NameIdentifier (UserId), Email, Name (FullName), Role, org_id.
- **Refresh token rotation:** DB-backed, SHA256 hashed, tracks IP/UserAgent/DeviceId. On refresh: old token revoked, new token issued. Reuse of revoked token = 401.
- **Password reset:** Token-based, 24-hour expiry. `POST /auth/forgot-password` sends reset link (generic success for security). `POST /auth/reset-password` validates token.
- **`IRequestContextService`:** Provides `ClientIp`, `UserAgent` for session metadata.
- **`ICurrentUserService`:** Extracts current user from JWT claims (SRP: dedicated service, not scattered claim reads).

## Security & Permissions

- **Roles:** Owner (full access), Manager (station ops), Nozzleman, Accountant, Custom
- **Granular permissions:** Per-module View/Edit/Delete/No Access
- **API-level checks:** `[Authorize(Roles = "...")]` on controllers. Query-level station access filtering.
- **Manager** can be assigned to multiple stations via `UserStation` junction table.
- **Owner** sees consolidated dashboard across all stations — bypasses station filters.

## Feature Gating (Strategy Pattern)

Check plan limits before resource creation. Feature flags stored as JSONB on plan.

```csharp
// Check station limit (Open/Closed: new plan tiers don't require code changes)
var subscription = await _subscriptionService.GetActiveSubscription(orgId);
var plan = subscription.Plan;

if (plan.MaxStations != -1)
{
    var stationCount = await _stationRepo.CountByOrgAsync(orgId);
    if (stationCount >= plan.MaxStations)
        return Result.Fail("Station limit reached. Upgrade your plan.");
}

// Check feature flag
if (!plan.Features.GetProperty("sms").GetBoolean())
    return Result.Fail("SMS not available on your plan. Upgrade to Professional.");
```

## Validation (Strategy Pattern via FluentValidation)

- `AbstractValidator<T>` per request DTO — each validator has single responsibility.
- Auto-validation in pipeline (`AddFluentValidationAutoValidation` in Program.cs).
- Custom rules: email format, Pakistani phone `+92XXXXXXXXXX`, password (min 6, must contain digit).
- Validators in `Application/Validators/`, auto-discovered from assembly.

## Naming Conventions

- **Commands:** `{Feature}{Action}Command` (e.g., `LoginCommand`, `CreateStationCommand`)
- **Queries:** `Get{Entity}{Criteria}Query` (e.g., `GetStationsByOrganizationQuery`)
- **Handlers:** `{CommandOrQuery}Handler` (e.g., `LoginCommandHandler`)
- **DTOs:** `{Action}{Entity}Request/Response` or `{Entity}Dto` (e.g., `LoginRequest`, `StationDto`)
- **Repositories:** `I{Entity}Repository` / `{Entity}Repository`
- **Services:** `I{Service}Service` / `{Service}Service`
- **Configurations:** `{Entity}Configuration` in `Infrastructure/Data/Configurations/`

## Testing Strategy

| Layer | Approach | Mocking |
|-------|----------|---------|
| **Domain** | Unit tests — business rules, entity logic | None needed (pure C#) |
| **Application** | Unit tests — command/query validation | Mock repository interfaces |
| **Infrastructure** | Integration tests — EF Core, query filters, multi-tenancy | Real DB (test container) |
| **Api** | Integration tests — full endpoint flows | `WebApplicationFactory` |

## Running the Backend

```bash
# PostgreSQL via Docker
cd server && docker compose up -d

# Apply migrations
dotnet ef database update --project FuelFlow.Infrastructure --startup-project FuelFlow.Api
# Or: ./db-update.ps1

# Create new migration
./db-migration-add.ps1 <MigrationName>

# Run API (http://localhost:5035, Swagger at /swagger)
dotnet run --project FuelFlow.Api/FuelFlow.Api.csproj
```

## Design Patterns in Use

| Pattern | Where | Purpose |
|---------|-------|---------|
| **Mediator** | MediatR `IMediator.Send()` | Decouples controllers from handlers |
| **CQRS** | Commands vs Queries | Separates read/write paths |
| **Repository** | `I{Entity}Repository` | Abstracts data access from business logic |
| **Unit of Work** | `IUnitOfWork` | Transaction boundary management |
| **Result/Either** | `Result<T>` | Explicit success/failure without exceptions |
| **Strategy** | FluentValidation validators | Swappable validation rules per DTO |
| **Builder** | EF Fluent API configurations | Declarative entity-to-table mapping |
| **Dependency Injection** | `DependencyInjection.cs` | Inverts control, enables testability |
