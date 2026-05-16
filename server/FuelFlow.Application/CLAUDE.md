# FuelFlow.Application — Business Logic Contracts

Defines the **what**, not the **how**. Commands, Queries, DTOs, validators, and interfaces live here. Infrastructure implements them (Dependency Inversion Principle).

**Only dependency:** FuelFlow.Domain

## Directory Structure

```
FuelFlow.Application/
├── Common/
│   └── Result.cs                    # Success/failure wrapper (Result Pattern)
├── DTOs/                            # One folder per feature
│   ├── Auth/                        # LoginRequest, AuthResponse, RegisterRequest, etc.
│   ├── Station/                     # CreateStationRequest, StationDto
│   ├── FuelTank/                    # CreateFuelTankRequest, FuelTankDto
│   ├── FuelType/                    # createFuelTypeRequest, FuelTypeDto
│   ├── FuelNozzle/                  # CreateFuelNozzleRequest, FuelNozzleDto
│   ├── FuelPrices/                  # SetFuelPriceRequest, FuelPricesDto
│   ├── OMC/                         # OMCDto, CreateOMCRequest
│   ├── OMCFuelType/                 # OMCFuelTypeDto, CreateOMCFuelTypeRequest
│   ├── StationShift/                # OpenShiftRequest, CloseShiftRequest, StationShiftDto
│   ├── ShiftAssignment/             # CreateShiftAssignmentRequest, ShiftAssignmentDto
│   ├── Onboarding/                  # OnboardingRequest
│   └── Organization/                # CreateOrganizationRequest/Response
├── Features/                        # CQRS Commands & Queries (one folder per feature)
│   ├── Auth/Commands/               # RegisterCommand, LoginCommand, LogoutCommand, etc.
│   ├── Auth/Queries/                # GetCurrentUserQuery
│   ├── Station/Commands/            # CreateStationCommand
│   ├── Station/Queries/             # GetStationsByOrganizationQuery
│   └── ...                          # Same pattern for all features
├── Interfaces/
│   ├── Repositories/                # Data access contracts (Interface Segregation)
│   └── Services/                    # External service contracts
└── Validators/                      # FluentValidation rules (one per request DTO)
```

## Result<T> (Result Pattern — No Exceptions for Business Logic)

```csharp
public class Result<T>
{
    public bool IsSuccess { get; }
    public T? Data { get; }
    public string? Error { get; }

    public static Result<T> Success(T data) => new(true, data, null);
    public static Result<T> Failure(string error) => new(false, default, error);
}
```

All commands and queries return `Result<T>`. Handlers never throw for expected business failures — they return `Result.Failure("reason")`.

## CQRS Convention (SRP: One Record, One Purpose)

**Commands** = state-changing operations:
```csharp
public record LoginCommand(LoginRequest Request) : IRequest<Result<AuthResponse>>;
public record CreateStationCommand(CreateStationRequest Request) : IRequest<Result<CreateStationResponse>>;
```

**Queries** = read-only operations:
```csharp
public record GetCurrentUserQuery(Guid UserId) : IRequest<Result<AuthResponse>>;
public record GetStationsByOrganizationQuery(Guid OrganizationId) : IRequest<Result<List<StationDto>>>;
```

**Naming:**
- Commands: `{Feature}{Action}Command` — e.g., `RegisterCommand`, `OpenShiftCommand`
- Queries: `Get{Entity}{Criteria}Query` — e.g., `GetFuelTanksByStationQuery`
- File location: `Features/{Feature}/Commands/` or `Features/{Feature}/Queries/`

**Rules:**
- Always a record (immutable, value equality)
- Always implements `IRequest<Result<T>>` (MediatR)
- Contains the request DTO or primitive params — no business logic
- Handlers live in Infrastructure (not here) — they need data access

## DTOs (Data Transfer Objects)

Flat POCOs for API request/response. One DTO per purpose — no god-objects.

**Naming:**
- Requests: `{Action}{Entity}Request` — e.g., `LoginRequest`, `CreateStationRequest`
- Responses: `{Action}{Entity}Response` or `{Entity}Dto` — e.g., `AuthResponse`, `StationDto`
- Organized by feature: `DTOs/{Feature}/`

**Rules:**
- Simple properties only — no methods, no logic
- Use `[JsonIgnore]` on sensitive fields that should never appear in responses
- One validator per request DTO (in `Validators/`)

## Validators (Strategy Pattern via FluentValidation)

One `AbstractValidator<T>` per request DTO. Auto-discovered and auto-executed via pipeline.

```csharp
public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Invalid email format");
        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required");
    }
}
```

**Rules:**
- Validate structure and format here (required, email format, min length, phone regex)
- Business validation (does user exist? is password correct?) happens in handlers
- Pakistani phone format: `+92XXXXXXXXXX` — validate with regex
- Password: min 6 chars, must contain at least one digit

## Interfaces (Dependency Inversion + Interface Segregation)

### Repository Interfaces (`Interfaces/Repositories/`)

Each repository is focused — only the methods that entity needs:

```csharp
public interface IStationRepository
{
    Task<Station?> GetByIdAsync(Guid id);
    Task<List<Station>> GetByOrganizationIdAsync(Guid orgId);
    Task<int> CountByOrganizationIdAsync(Guid orgId);
    Task AddAsync(Station station);
}
```

**Repositories:** IOrganizationRepository, IStationRepository, IFuelTankRepository, IFuelTypeRepository, IFuelPricesRepository, IFuelNozzleRepository, IStationShiftRepository, IShiftAssignmentRepository, IOMC-Repository, IOMC-FuelTypeRepository, IUserStationRepository, ISubscriptionRepository, ISubscriptionPlanRepository, IRefreshTokenRepository, IUnitOfWork

### Service Interfaces (`Interfaces/Services/`)

```csharp
public interface IAuthService
{
    Task<bool> SendVerificationEmailAsync(string email, string userId, string token);
    Task<bool> SendPasswordResetEmailAsync(string email, string userId, string token);
}

public interface ICurrentUserService
{
    Guid UserId { get; }
    string Role { get; }
    Guid? OrganizationId { get; }
}
```

**Services:** IAuthService, ICurrentUserService, IEmailSender, IRequestContextService

**Rules:**
- Interfaces return `Task<T>` for async operations — always async
- `IAuthService` returns `bool` (not throw) for idempotent email operations
- `ICurrentUserService` extracts claims — never read HttpContext in handlers directly

## Multi-Tenancy in Commands & Queries

Every Command or Query that touches station-scoped data MUST be scoped to the current user's authorised station(s). Don't trust station IDs sent by the client.

```csharp
public class CreateFuelTankCommandHandler : IRequestHandler<CreateFuelTankCommand, Result<FuelTankDto>>
{
    private readonly IFuelTankRepository _tanks;
    private readonly ICurrentUserService _currentUser;

    public async Task<Result<FuelTankDto>> Handle(CreateFuelTankCommand cmd, CancellationToken ct)
    {
        // 1. Resolve station from the cmd; backend checks it belongs to the caller's org
        if (!await _currentUser.HasAccessToStationAsync(cmd.Request.StationId))
            return Result.Failure<FuelTankDto>("Forbidden");

        // 2. Build entity — the global query filter in DbContext will also enforce StationId on reads
        var tank = new FuelTank { ... StationId = cmd.Request.StationId ... };
        await _tanks.AddAsync(tank);
        return Result.Success(_mapper.ToDto(tank));
    }
}
```

**Rules:**
- Validate the caller has access to the `StationId` referenced in the request, ALWAYS — even if EF Core's global query filter will block stale reads.
- Owner role can act across all stations of their organisation (consolidated view).
- Manager role can act only on stations in their `UserStation` join rows.
- Nozzleman role can act only on the currently-open shift's station.
- See [M01-F07](../../docs/MODULES.md#m01-f07--multi-station-access) for the access rules; see `server/FuelFlow.Infrastructure/CLAUDE.md` for the corresponding global query filter pattern.

## DTO ↔ Entity Mapping (Mapperly)

Use Mapperly source-generated mappers — zero reflection, generated as `partial` classes at compile time.

```csharp
// FuelFlow.Application/Mapping/FuelTankMapper.cs
[Mapper]
public partial class FuelTankMapper
{
    public partial FuelTankDto ToDto(FuelTank entity);
    public partial FuelTank ToEntity(CreateFuelTankRequest request);
}
```

**Rules:**
- One mapper per aggregate root (FuelTank, Station, User, …); colocate with the entity's feature folder.
- DI register as singleton (mappers are stateless).
- Never hand-write `new FuelTankDto { Id = entity.Id, ... }` — let Mapperly generate it.
- For complex mappings (Pakistani phone formatting, computed fields), add a partial method or a custom `[MapProperty]` attribute.

## Adding a New Feature

1. **DTO** — Create request/response in `DTOs/{Feature}/`
2. **Command or Query** — Create record in `Features/{Feature}/Commands/` or `Queries/`
3. **Validator** — Create `AbstractValidator<TRequest>` in `Validators/`
4. **Interface** — If new data access needed, add to `Interfaces/Repositories/` or `Services/`
5. **Handler** — Implement in `Infrastructure/Features/{Feature}/` (not here)
6. **Controller** — Wire up in `Api/Controllers/`
