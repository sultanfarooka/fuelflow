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

## API Conventions

Cross-cutting rules that apply to every endpoint. Most are enforced in `Program.cs` or via the `[ApiController]` infrastructure — don't reinvent them per controller.

| Aspect | Convention |
|---|---|
| Base URL | `/api/v1` — version is path-segment, never header |
| Format | JSON only; camelCase keys (`JsonStringEnumConverter` + camelCase contract resolver) |
| Auth | JWT via HTTP-only cookies (`access_token`, `refresh_token`); never `Authorization: Bearer …` |
| Errors | RFC 7807 Problem Details for validation; `{ error: "message" }` for business-rule failures (see example below) |
| Pagination | `?page=1&pageSize=20` — `pageSize` capped server-side (default cap: 100) |
| Sorting | `?sortBy=name&sortOrder=asc` — `sortOrder` ∈ {`asc`, `desc`} |
| Filtering | `?status=active&search=xyz` — match exact for enums; ILIKE wildcard for `search` |
| Multi-tenancy | EF Core global query filter on `StationId` applies automatically; Owner role bypasses filter for consolidated views |

### Error Response Format (RFC 7807)

For FluentValidation failures the controller emits the auto-generated Problem Details:

```json
{
  "type": "https://api.fuelflow.pk/errors/validation",
  "title": "Validation Error",
  "status": 400,
  "detail": "One or more validation errors occurred.",
  "errors": {
    "email": ["Email is already registered."],
    "password": ["Password must be at least 6 characters."]
  }
}
```

For business-rule failures returned via the `Result<T>` pattern, the shape is `{ "error": "Customer is at credit limit" }` with HTTP 400. **Never leak stack traces, EF Core exception text, or internal IDs to the client.**

## Sample Request / Response Payloads

A few representative shapes. Swagger (`/swagger`) is the authoritative catalogue — when these samples drift from current DTOs, **trust Swagger and the DTOs in `FuelFlow.Application/DTOs/`**.

### Owner Registration — [M01-F01](../../docs/MODULES.md#m01-f01--self-service-registration)

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "fullName": "Muhammad Tariq",
  "email": "tariq@example.com",
  "phone": "+923001234567",
  "password": "SecurePass123",
  "deviceId": "optional-browser-fingerprint"
}
```

```json
{
  "success": true,
  "data": { "message": "Please check your email to verify your account." }
}
```

### Login — [M01-F03](../../docs/MODULES.md#m01-f03--login--session)

```http
POST /api/v1/auth/login
Content-Type: application/json

{ "email": "manager@station.com", "password": "SecurePass123" }
```

```json
{
  "success": true,
  "data": {
    "expiresIn": 3600,
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "manager@station.com",
      "fullName": "Ahmed Khan",
      "role": "manager",
      "stations": [{ "id": "660e8400-...", "name": "Al-Madina Filling Station" }]
    },
    "subscription": { "plan": "professional", "status": "trial" }
  }
}
```

Tokens are placed in HTTP-only cookies (`access_token`, `refresh_token`). They are NOT in the JSON body.

### Refresh Token — [M01-F03](../../docs/MODULES.md#m01-f03--login--session)

```http
POST /api/v1/auth/refreshToken
```

Refresh token is read from the `refresh_token` cookie. Response shape mirrors Login (new cookies set; JSON returns `expiresIn`, `user`, `subscription`). Old refresh token is revoked atomically (rotation).

### Record Meter Reading — [M03-F02](../../docs/MODULES.md#m03-f02--meter-reading-entry)

```http
POST /api/v1/station-shifts/{shiftId}/meter-reading
Content-Type: application/json

{
  "nozzleId": "770e8400-...",
  "readingType": "closing",
  "totalizerValue": 1234567.50,
  "imageUrl": "https://s3.../meter-photo.jpg"
}
```

```json
{ "success": true, "data": { "readingId": "..." } }
```

## Adding a New Controller

1. Create `{Resource}Controller.cs` in `Controllers/`
2. Inherit `ControllerBase`, add `[ApiController]` and `[Route("api/v1/{resource}")]`
3. Add `[Authorize]` or `[Authorize(Roles = "...")]` as needed
4. Inject `IMediator` only
5. Each action: receive request DTO -> create command/query -> `_mediator.Send()` -> map result to HTTP response
