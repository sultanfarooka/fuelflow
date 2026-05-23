# Environment variables

> Map only — do not store values here.
> Claude checks this before adding any `Configuration["…"]` / `import.meta.env.VITE_*` reference.
> When the running app reads a key that's not in this file, add it here in the same PR.

## Backend — ASP.NET Core (`server/`)

In development these are stored as **.NET user-secrets** (`dotnet user-secrets set "Key" "Value"`, scoped to [`server/FuelFlow.Api/FuelFlow.Api.csproj`](../server/FuelFlow.Api/FuelFlow.Api.csproj)). In production they come from environment variables or the hosting platform's secret store.

| Key | Used in | Required | Exposure | Notes |
|---|---|---|---|---|
| `ConnectionStrings:DefaultConnection` | [`server/FuelFlow.Infrastructure/DependencyInjection.cs`](../server/FuelFlow.Infrastructure/DependencyInjection.cs) | **Yes** | Server only | PostgreSQL connection string. Dev format: `Host=localhost;Port=5432;Database=fuelflow_dev;Username=fuelflow;Password=…` |
| `Jwt:Secret` | [`server/FuelFlow.Api/Program.cs`](../server/FuelFlow.Api/Program.cs), `JwtTokenService.cs` | **Yes** | Server only | Minimum 32 characters — used to sign access + refresh tokens (HS256) |
| `Jwt:Issuer` | `Program.cs`, `JwtTokenService.cs` | **Yes** | Server only | Currently `FuelFlow` |
| `Jwt:Audience` | `Program.cs`, `JwtTokenService.cs` | **Yes** | Server only | Currently `FuelFlow` |
| `Jwt:ExpiresInMinutes` | `Program.cs`, `JwtTokenService.cs`, `AuthCookieOptions.cs` | No (default 60) | Server only | Access-token TTL. Refresh-token TTL is fixed at 7 days in code (see [`server/FuelFlow.Api/CLAUDE.md`](../server/FuelFlow.Api/CLAUDE.md) Cookie Handling) |
| `Email:SmtpHost` | `SmtpEmailSender.cs`, [`appsettings.json`](../server/FuelFlow.Api/appsettings.json) | Conditional | Server only | Currently `smtp.gmail.com`. Required when email delivery is enabled |
| `Email:SmtpPort` | `SmtpEmailSender.cs`, `appsettings.json` | No (default 587) | Server only | |
| `Email:UseSsl` | `SmtpEmailSender.cs`, `appsettings.json` | No (default `true`) | Server only | |
| `Email:Username` | `SmtpEmailSender.cs` | Conditional | Server only | User-secret in dev. Required when SMTP server enforces auth |
| `Email:Password` | `SmtpEmailSender.cs` | Conditional | Server only | User-secret in dev. **Never commit** |
| `Email:FromAddress` | `SmtpEmailSender.cs` | No | Server only | Default `noreply@fuelflow.pk` |
| `Email:FromName` | `SmtpEmailSender.cs` | No | Server only | Default `Fuel Flow` |
| `FrontendUrl` | `AuthService.cs`, `appsettings.json` | No | Server only | Default `http://localhost:5173`. Embedded into email-verification + password-reset links |
| `AllowedHosts` | `appsettings.json` | No | Server only | Currently `*`. Tighten before public deploy |
| `Logging:LogLevel:Default` | `appsettings.json` | No | Server only | Serilog default (`Information`) |
| `Logging:LogLevel:Microsoft.AspNetCore` | `appsettings.json` | No | Server only | `Warning` to quiet framework noise |

### How to set user-secrets in dev

```powershell
cd server/FuelFlow.Api
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=fuelflow_dev;Username=fuelflow;Password=fuelflow123"
dotnet user-secrets set "Jwt:Secret" "your-secret-key-at-least-32-characters-long"
dotnet user-secrets set "Jwt:Issuer" "FuelFlow"
dotnet user-secrets set "Jwt:Audience" "FuelFlow"
```

(Full list of dev commands is in root [`CLAUDE.md`](../CLAUDE.md) "Development Setup".)

## Frontend — Vite (`fuel-flow-web/`)

Stored in [`fuel-flow-web/.env`](../fuel-flow-web/.env) (gitignored) and tracked in [`fuel-flow-web/.env.example`](../fuel-flow-web/.env.example). **Every `VITE_*` key is bundled into the browser** — never put secrets behind a `VITE_` prefix.

| Key | Used in | Required | Exposure | Notes |
|---|---|---|---|---|
| `VITE_API_BASE_URL` | [`fuel-flow-web/src/lib/api/client.ts`](../fuel-flow-web/src/lib/api/client.ts) | No | **Public** | Default `http://localhost:5035/api/v1`. Set per-environment for staging / prod |
| `VITE_ENV` | [`fuel-flow-web/.env.example`](../fuel-flow-web/.env.example) | No | **Public** | Default `development`. Used as a label only; do not gate behavior on it |

---

## Rules

- **Never commit values** — only key names. Real values live in user-secrets, environment variables, or the hosting platform's secret store.
- **`VITE_*` keys are public** — anything prefixed `VITE_` ends up in the browser bundle. Secrets stay backend-only.
- **Update this file in the same PR** that adds a new `Configuration["…"]` or `import.meta.env.VITE_*` reference. A new env read without a row here is a config bug waiting to happen.
- **`.env.example` is the canonical frontend template** — keep it in sync with the table above. Backend has no `.env.example` (user-secrets are the dev mechanism); the table above is the equivalent.
