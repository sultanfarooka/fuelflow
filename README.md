# Fuel Flow

Comprehensive filling station management system for the Pakistani market. Station owners manage multiple filling stations, track fuel inventory, handle credit customers (udhaar), run shift-based operations, and generate reports.

## Tech Stack

**Backend:** ASP.NET Core 10 (C# 12), EF Core 10, PostgreSQL 16, MediatR 14, FluentValidation 12, Mapperly 4.3, Serilog, JWT (HTTP-only cookies)
**Frontend:** React 19, Vite 7, TypeScript 5.9, TanStack (Router/Query/Form/Table), Zustand 4.5, shadcn/ui, Tailwind CSS, Zod, Axios, i18next, Recharts, Sonner
**Infra:** Docker + Docker Compose, GitHub Actions

Per-layer details: [`server/CLAUDE.md`](server/CLAUDE.md), [`fuel-flow-web/CLAUDE.md`](fuel-flow-web/CLAUDE.md).

## Repository Layout

```
server/                         # ASP.NET Core backend (see server/CLAUDE.md)
  FuelFlow.Api/                 # Controllers, Program.cs composition root
  FuelFlow.Application/         # Commands, Queries, DTOs, Validators, Interfaces
  FuelFlow.Domain/              # Entities, Enums, BaseEntity (pure C#, zero packages)
  FuelFlow.Infrastructure/      # EF Core, Handlers, Repos, Services
  docker-compose.yml            # PostgreSQL 16
fuel-flow-web/                  # React frontend
docs/                           # SRD, ProjectOverview, MODULES (legacy)
scripts/                        # dev.ps1, migrate.ps1 — see scripts/README.md
```

## Development Setup

**Prerequisites:** Node.js 18+, .NET 10 SDK, Docker Desktop, `dotnet tool install --global dotnet-ef`

```bash
# 1. Start PostgreSQL (container publishes host port 5432 — see server/docker-compose.yml)
cd server && docker compose up -d

# 2. Configure secrets (first time only)
#    DefaultConnection is already in appsettings.Development.json (Port=5432), so
#    a user-secret for it is optional in dev; if you set one it must use 5432.
cd server/FuelFlow.Api
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=fuelflow_dev;Username=fuelflow;Password=fuelflow123"
dotnet user-secrets set "Jwt:Secret" "your-secret-key-at-least-32-characters-long"
dotnet user-secrets set "Jwt:Issuer" "FuelFlow"
dotnet user-secrets set "Jwt:Audience" "FuelFlow"

# 3. Apply migrations
cd server && dotnet ef database update --project FuelFlow.Infrastructure --startup-project FuelFlow.Api

# 4. Run backend (http://localhost:5035, Swagger at /swagger)
dotnet run --project server/FuelFlow.Api/FuelFlow.Api.csproj

# 5. Run frontend (http://localhost:5173)
cd fuel-flow-web && npm install && npm run dev

# Or run both together:
./scripts/dev.ps1
```

## Run the whole stack in Docker (one command)

For a containerized run of Frontend + Backend + DB together (no local .NET/Node needed),
use the root `docker-compose.yml`:

```bash
cp .env.example .env          # fill in POSTGRES_PASSWORD / JWT_SECRET / OTP_HASH_PEPPER
docker compose up --build     # app at http://localhost
```

nginx serves the built SPA and reverse-proxies `/api` → the API (same-origin, so HTTP-only
auth cookies work with no CORS). The API runs in `Production` mode but, for this local-HTTP
profile, compose sets `Auth__CookieSecure=false` (cookies over plain HTTP) and
`Database__MigrateOnStartup=true` (control-plane migrations applied on boot). With no SMS
gateway, `Sms__Provider=console` prints signup OTPs to `docker compose logs api`. This is the
full-stack runner; `server/docker-compose.yml` remains the DB-only dev DB used by `dev.ps1`.

## Documentation

- **Conventions, architecture, workflow rules:** [`CLAUDE.md`](CLAUDE.md) (root) + scoped `CLAUDE.md` files next to the code.
- **Module / feature specs:** [`docs/SRD.md`](docs/SRD.md) → per-feature specs under [`docs/srd/`](docs/srd/). Modules not yet migrated live in deprecated [`docs/MODULES.md`](docs/MODULES.md).
- **Business overview:** [`docs/ProjectOverView.md`](docs/ProjectOverView.md).
- **Dev scripts:** [`scripts/README.md`](scripts/README.md).
