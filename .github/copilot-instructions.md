<!-- Copied/merged guidance for AI coding agents. Keep concise and update when `.cursorrules` changes. -->

# Copilot Instructions — Fuel Flow

Purpose: short, actionable guidance to make AI coding agents immediately productive in this repo.

- Project shape: backend is a .NET (ASP.NET) solution under `server/` with four projects: `FuelFlow.Api`, `FuelFlow.Application`, `FuelFlow.Domain`, `FuelFlow.Infrastructure`. Frontend is a Vite + React + TypeScript app in `fuel-flow-web/`.

- Architecture notes:
  - The server follows a layered, CQRS/MediatR pattern: handlers live in `server/FuelFlow.Application/Features/*`, DTOs in `server/FuelFlow.Application/DTOs`, and validators in `server/FuelFlow.Application/Validators` (e.g. `ForgotPasswordRequestValidator.cs`).
  - `FuelFlow.Api` exposes controllers in `server/FuelFlow.Api/Controllers` (notable: `AuthController.cs`, `StationsController.cs`, `DashboardController.cs`) which call into Application services via MediatR.
  - Infrastructure contains EF Core migrations, Repositories and Services in `server/FuelFlow.Infrastructure/` and a central `DependencyInjection.cs` where DI registrations live.
  - Authentication uses HTTP-only cookies + refresh-token pattern (see `Options/AuthCookieOptions.cs`, `Options/CookieConstants.cs` and `.cursorrules` changelog entries referring to `/auth/refreshToken`).

- Frontend patterns:
  - Entry: `fuel-flow-web/src/main.tsx` and app shell/routes in `fuel-flow-web/src/routes/` (`__root.tsx`, `index.tsx`, `dashboard.tsx`). Route generation lives in `fuel-flow-web/routeTree.gen.ts` — respect generated file when changing routes.
  - UI: Tailwind + small component library; look at `fuel-flow-web/src/components/*` (e.g. `login-form.tsx`, `dark-mode-toggle.tsx`, `theme-provider.tsx`).
  - State/hooks: queries live under `fuel-flow-web/src/hooks/queries`, and client stores under `fuel-flow-web/src/stores` (e.g. `auth-store.ts`). Follow existing hooks/store shapes.

- Developer workflows (concrete commands):
  - Backend build: `dotnet build server/FuelFlow.Api/FuelFlow.Api.csproj` or open the solution `server/FuelFlow.slnx` in your IDE.
  - Run API locally: `dotnet run --project server/FuelFlow.Api/FuelFlow.Api.csproj` (uses `appsettings.Development.json` for local settings).
  - Frontend install & dev: `cd fuel-flow-web && npm ci && npm run dev` (Vite dev server; there is a VS Code task labeled "Start Vite Dev Server").
  - Docker: `docker-compose up` from `server/` will bring configured services (see `server/docker-compose.yml`).

- Conventions and patterns to follow in PRs:
  - Keep Application layer logic in `FuelFlow.Application`; controllers should only orchestrate requests and call MediatR.
  - New features get a Feature folder under `FuelFlow.Application/Features/<FeatureName>` with Request/Handler/Validator/DTO colocated.
  - Use FluentValidation validators located in `Validators/` and name them `<RequestName>Validator`.
  - DI registrations belong in `FuelFlow.Infrastructure/DependencyInjection.cs` for infra implementations and in `FuelFlow.Api/Program.cs` only for wiring.
  - Frontend: prefer component and hook patterns already present; update `routeTree.gen.ts` via the route tooling instead of manual edits.

- Integration touchpoints & gotchas:
  - Auth is cookie-based: the frontend relies on cookies for authenticated calls. Avoid switching to token-in-header without updating cookie/refresh flow (`AuthController`, `AuthCookieOptions.cs`).
  - Migration and DB changes: check `FuelFlow.Infrastructure/Migrations` and register migrations via DI; prefer incremental EF Core migrations.
  - Generated files: `routeTree.gen.ts` and some `obj/` artifacts are generated — do not edit generated files directly.

- Where to look for examples:
  - API wiring: `server/Program.cs` and `server/FuelFlow.Infrastructure/DependencyInjection.cs`.
  - Auth flow: `server/Controllers/AuthController.cs`, `server/Options/AuthCookieOptions.cs`, and `server/FuelFlow.Application/Features/Auth`.
  - Frontend route and auth usage: `fuel-flow-web/src/routes/__root.tsx`, `fuel-flow-web/src/components/auth/login-form.tsx`, `fuel-flow-web/src/stores/auth-store.ts`.

- On updating this file: `.cursorrules` is the canonical quick-reference for AI agents; keep this file short and sync changes from `.cursorrules` and `docs/PRD.md` when behavior changes. See `.cursorrules` for more detailed, evolving AI guidance.

- If anything here is incomplete or you want deeper examples (requests, handler examples, or a sample end-to-end dev session), tell me which area to expand.
