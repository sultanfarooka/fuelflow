# FuelFlow.Api — Composition Root & Controllers

The only project that references all layers. Responsible for wiring DI, HTTP pipeline, and thin REST controllers.

## Program.cs (Composition Root)

Single file that orchestrates all dependency injection and middleware. Key registrations:

1. **Serilog** — structured logging to console
2. **Infrastructure** — `builder.Services.AddInfrastructure(config)` (single call registers everything)
3. **JWT Authentication** — reads tokens from HTTP-only cookies only (NOT Authorization header)
4. **FluentValidation** — `AddFluentValidationAutoValidation()` auto-discovers validators from Application assembly
5. **CORS** — allows `http://localhost:5173` (Vite frontend) with credentials
6. **Swagger** — OpenAPI docs in development at `/swagger`
7. **Controllers** — camelCase JSON serialization via `JsonStringEnumConverter`

**Dev URL:** `http://localhost:5035`

## Controller Pattern (SRP: Each Controller = One Resource)

Controllers are **thin dispatchers** — no business logic, no data access, no validation.

```csharp
[ApiController]
[Route("api/v1/stations")]
[Authorize(Roles = "Owner,Manager")]
public class StationController : ControllerBase
{
    private readonly IMediator _mediator;

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateStationRequest request)
    {
        var result = await _mediator.Send(new CreateStationCommand(request));
        if (!result.IsSuccess) return BadRequest(new { error = result.Error });
        return Ok(new { success = true, data = result.Data });
    }
}
```

**Rules:**
- Only call `_mediator.Send()` — never inject repositories or services directly
- Return `{ success: true, data: {...} }` on success
- Return `{ error: "message" }` with appropriate HTTP status on failure
- Use `[Authorize]` for authenticated endpoints, `[Authorize(Roles = "...")]` for role-based
- Auth endpoints that set/clear cookies use `AuthCookieOptions` (injected)

## Controllers (12 Total)

| Controller | Route | Auth | Purpose |
|-----------|-------|------|---------|
| AuthController | `api/v1/auth/*` | Public (most) | Register, Login, Logout, RefreshToken, VerifyEmail, ForgotPassword, ResetPassword, GetMe |
| DashboardController | `api/v1/dashboard` | Owner, Manager | Dashboard summary |
| OnboardingController | `api/v1/onboarding` | Authenticated | First-time org/station setup |
| StationController | `api/v1/stations` | Owner, Manager | Station CRUD |
| FuelTankController | `api/v1/fuel-tanks` | Authenticated | Tank management |
| FuelTypeController | `api/v1/fuel-types` | Authenticated | Fuel type CRUD |
| FuelNozzleController | `api/v1/fuel-nozzles` | Authenticated | Nozzle configuration |
| FuelPricesController | `api/v1/fuel-prices` | Authenticated | Price management |
| OMCController | `api/v1/omcs` | Authenticated | Oil Marketing Company list |
| OMCFuelTypeController | `api/v1/omc-fuel-types` | Authenticated | OMC fuel type management |
| StationShiftController | `api/v1/station-shifts` | Authenticated | Shift open/close |
| ShiftAssignmentController | `api/v1/shift-assignments` | Authenticated | Nozzleman assignment |

## Cookie Handling

**CookieConstants.cs:**
- `AccessToken = "access_token"`
- `RefreshToken = "refresh_token"`

**AuthCookieOptions.cs** — builds `CookieOptions` per token type:
- Access token: HttpOnly, SameSite=Lax, expires per JWT config (~1 hour)
- Refresh token: HttpOnly, SameSite=Lax, 7 days
- `Secure = true` in production, `false` in development

Only `AuthController` sets/clears cookies (Login, RefreshToken, Logout). Other controllers never touch cookies.

## Response Conventions

| Scenario | HTTP Status | Body |
|----------|-------------|------|
| Success | 200 OK | `{ success: true, data: {...} }` |
| Validation failure | 400 Bad Request | `{ error: "message" }` |
| Auth failure | 401 Unauthorized | `{ error: "message" }` |
| Not found | 404 Not Found | `{ error: "message" }` |
| Business rule violation | 400 Bad Request | `{ error: "message" }` |

## Adding a New Controller

1. Create `{Resource}Controller.cs` in `Controllers/`
2. Inherit `ControllerBase`, add `[ApiController]` and `[Route("api/v1/{resource}")]`
3. Add `[Authorize]` or `[Authorize(Roles = "...")]` as needed
4. Inject `IMediator` only
5. Each action: receive request DTO -> create command/query -> `_mediator.Send()` -> map result to HTTP response
