# Changelog

All notable changes to the Fuel Flow project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.12.0] - 2026-02-23

### Added
- **Logout endpoint** — `POST /api/v1/auth/logout` revokes refresh token (from cookie or body), clears auth cookies
- **Cookie-based auth** — Tokens stored in HTTP-only cookies; JSON responses omit tokens; client uses `credentials: include`

### Changed
- **Auth forms** — Validation on submit only (TanStack Form validators `onSubmit`); errors show after user submits
- **PRD** — v1.7.0; logout marked Implemented; API conventions updated for cookie-based auth; Login/Refresh samples reflect cookie flow; UI spec: auth forms validate on submit only
- **IMPLEMENTATION_STATUS** — Logout endpoint added; Dashboard marked Done (basic placeholder with route guard); API client noted as cookie-based
- **.cursorrules** — Auth conventions updated for HTTP-only cookies; Refresh Token pattern includes logout and cookie flow

### Technical Decisions
- **HTTP-only cookies over Bearer token in JSON**: Reduces XSS risk; tokens not accessible to JavaScript; SameSite and Secure flags for CSRF protection

---

## [1.11.0] - 2026-02-19

### Changed
- **Form library** — Switched from React Hook Form to TanStack Form:
  - Same ecosystem as TanStack Router and TanStack Query
  - Framework-agnostic, works with Zod for validation
  - Updated `.cursorrules`, `docs/PRD.md`, `fuel-flow-web/README.md`

---

## [1.10.0] - 2026-02-19

### Added
- **Password reset flow** — Token-based reset via email:
  - `POST /auth/forgot-password` — sends reset link (generic success for security)
  - `POST /auth/reset-password` — resets password using token from link
  - Token expiry: 24 hours (DataProtectionTokenProviderOptions)
  - IAuthService extended with `SendPasswordResetEmailAsync`
- **PRD sync** — forgot-password and reset-password marked Implemented; password reset flow documented

### Changed
- **PRD** — v1.6.0; auth endpoints table updated; password reset flow documented
- **IMPLEMENTATION_STATUS** — Auth area includes ForgotPassword, ResetPassword; endpoints table updated
- **.cursorrules** — Password Reset pattern added; fixed refresh endpoint path (`/auth/refreshToken`)

---

## [1.9.0] - 2026-02-18

### Added
- **Email verification** — Users must verify email before login (REG-005):
  - Registration sends verification email; no tokens returned until verified
  - Login blocked if `EmailConfirmed` is false
  - `POST /auth/verify-email` — verify using token from link
  - `POST /auth/resend-verification` — resend verification email (generic response for security)
- **Frontend auth pages** — Login, Register (multi-step), Check-email, Verify-email
- **PRD** — REG-005, verify-email and resend-verification endpoints

### Changed
- **Register** — Returns `{ success, message }` instead of tokens; verification email sent
- **Login** — Returns error if email not verified; resend link shown
- **API client** — Error handling uses `error` field from backend responses

---

## [1.8.0] - 2026-02-18

### Added
- **Implementation Status doc** (`docs/IMPLEMENTATION_STATUS.md`) — Single source of truth for what's implemented and where to continue:
  - "Where to Continue" — Explicit next tasks (1.4c, 1.6, 1.8, etc.)
  - Current state summary (Backend, Frontend, Database)
  - Implemented endpoints quick reference
  - Phase 1 progress with ✅/⬜ status
  - Links to PRD, CHANGELOG, update-docs workflow

### Changed
- **update-docs workflow** — Step 2: Update IMPLEMENTATION_STATUS when implementation changes; Mode B: Update IMPLEMENTATION_STATUS after sync; Final Verification: Check IMPLEMENTATION_STATUS; Quick Reference table: Added IMPLEMENTATION_STATUS column
- **PRD** — Document Relationships: Added Implementation Status
- **.cursorrules** — Key Documents: Added Implementation Status
- **fuel-flow-web README** — Next Steps now points to Implementation Status; removed outdated "Phase 1.2 - Backend Setup"

---

## [1.7.0] - 2026-02-18

### Added
- **Update-docs workflow: Mode B (Sync PRD from Codebase)** — New workflow mode for code-first sync:
  - Trigger: "Sync project state with PRD" or "Update PRD to match current codebase"
  - Discovery checklist: Controllers, DTOs, migrations, .csproj versions
  - Comparison checklist: PRD vs codebase (endpoints, tech versions, entities, phases)
  - Update rules: Fix paths, add missing endpoints, update versions, mark implemented phases
  - Example 4 added for Mode B usage

### Changed
- **PRD** — Document Relationships: Controllers/Swagger as endpoint source of truth; fixed auth endpoint path (`/auth/refreshToken` not `/auth/refresh`); added Dashboard endpoints section (`GET /dashboard/summary`); renumbered API sections (4.3–4.6)
- **update-docs workflow** — Best practices: Controllers = endpoint source of truth; new Troubleshooting Q for Mode B

### Technical Decisions
- **Code as source of truth for sync**: When PRD drifts from code, Mode B discovers what exists and updates PRD to match—not the other way around.

---

## [1.6.0] - 2026-02-18

### Added
- **DB-backed refresh tokens** — Secure refresh token flow with rotation:
  - `refresh_tokens` table stores hashed tokens (never plain text)
  - Login/Register create and persist refresh tokens; return plain token to client
  - `POST /api/v1/auth/refreshToken` exchanges valid token for new access + refresh tokens (rotation)
  - Old token revoked on refresh; reuse detection returns 401
- **Session tracking** — Per-token metadata for audit and future "active sessions" UI:
  - `ip_address`, `user_agent` from request (via `IRequestContextService`)
  - Optional `deviceId` from client (LoginRequest, RegisterRequest, RefreshTokenRequest)
- **New services**: `IRequestContextService` (ClientIp, UserAgent), `IRefreshTokenRepository`
- **New commands**: `RefreshTokenCommand`, `RefreshTokenCommandHandler`

### Changed
- **PRD** — Added refresh_tokens schema, refresh endpoint spec, session tracking; v1.5.0 sync: Document relationships section, tech versions (ASP.NET 10, EF Core 10, MediatR 14, FluentValidation 12), flat Register sample, endpoint status (Implemented/Planned), RFC 7807 error example, schema simplification (key entities + collapsible full reference), Identity/AspNetUsers note, Development Phases status
- **Project Overview** — Updated 1.3 Authentication with refresh token and session tracking
- **.cursorrules** — Added refresh token pattern, key entities, version sync; tech stack updated to ASP.NET 10, EF Core 10, MediatR 14, FluentValidation 12

### Technical Decisions
- **DB-backed over stateless**: Enables per-session revocation, "logout everywhere", audit trail
- **Rotation on refresh**: Each refresh issues new token, revokes old; detects reuse (possible breach)
- **7-day default expiry**: Configurable per-user later; enforced via `ExpiresAt` checks

---

## [1.5.0] - 2026-02-10

### Changed
- **PRD** — Added CQRS pattern and MediatR to technical specifications:
  - Section 1.2 Backend: Added MediatR to technology stack
  - Section 2.1: Updated architecture diagram (Controllers → MediatR → Handlers)
  - New subsection: CQRS & MediatR pattern with request flow and benefits
  - Section 2.2: Updated project structure (Features/Commands, Features/Queries, Handlers)
- **Project Overview** — Added "Backend Architecture" to Technical Considerations (CQRS + MediatR, Result pattern)
- **.cursorrules** — Synced with CQRS/MediatR: tech stack, architecture table, project structure, Common Patterns section

### Technical Decisions
- **CQRS over service layer**: Commands and queries provide clear separation; handlers encapsulate business logic; controllers stay thin
- **MediatR for in-process messaging**: No external message bus needed; type-safe dispatching; handlers auto-registered from assembly

---

## [1.4.0] - 2026-02-08

### Changed
- **Backend architecture upgraded to Clean Architecture** — 4 separate .NET projects replacing the single-project structure:
  - `FuelFlow.Domain` — Pure C# entities, enums, business rules (zero dependencies)
  - `FuelFlow.Application` — Service/repository interfaces, DTOs, validators, Result type
  - `FuelFlow.Infrastructure` — EF Core, repository implementations, JWT, external services
  - `FuelFlow.Api` — Controllers, middleware, Program.cs (composition root)
- Updated PRD Section 2 (Architecture Overview + Project Structure) with full Clean Architecture diagrams and dependency rules
- Updated `.cursorrules` backend section with per-layer code standards
- Updated `.cursorrules` project structure to reflect 4-project layout

### Technical Decisions
- **Clean Architecture over simple 3-layer**: Fuel Flow has 10+ modules, multi-tenancy, subscriptions, and feature gating — the complexity warrants proper separation of concerns. Converting from 3-layer to Clean Architecture later would require a full restructure, so we start right.
- **4 projects over 1 project with folders**: Separate `.csproj` files enforce dependency rules at compile time. Domain can never accidentally import EF Core — it simply won't compile.
- **Domain entities as POCOs**: No `[Table]` or `[Column]` attributes on entities. EF Core mapping is done via Fluent API in Infrastructure, keeping Domain framework-agnostic.
- **ASP.NET Identity in Infrastructure**: Identity's `IdentityUser` is extended with custom fields (FullName, PinHash, OrganizationId). Identity lives only in Infrastructure — Application and Domain never reference it.

### Why These Choices?
- Clean Architecture is the industry standard for enterprise .NET applications
- Compile-time dependency enforcement prevents architectural drift as the team grows
- Unit testing becomes easier — Domain and Application logic can be tested without a database or web server
- Infrastructure can be swapped (e.g., different database) without touching business logic
- Learning opportunity — understanding Clean Architecture principles applies to any large .NET project

---

## [1.3.0] - 2026-02-08

### Added
- **Owner Registration** – Self-service registration flow for station owners
  - Multi-step form: owner info → organization → first station
  - Creates organization, owner user, station, and trial subscription in one transaction
  - Auto-login after registration with redirect to dashboard
- **Subscription Plans** – Tiered pricing model (Starter / Professional / Enterprise)
  - Monthly and yearly billing cycles (yearly gives ~17% discount)
  - Plan limits on stations, users, and module access
  - Feature flags stored as JSONB for flexible gating
- **Trial Mode** – 14-day free trial with Professional plan features
  - No credit card required to start
  - Read-only mode after trial expires
  - 3-day grace period after subscription expiry
- **Feature Gating** – Plan-based access control
  - API-level enforcement (not just UI)
  - Station and user count limits per plan
  - Module access controlled via plan feature flags
  - Upgrade prompts on locked features
- **Payment System** – Manual bank transfer verification (v1)
  - Upload receipt image as proof of payment
  - Admin verification queue for pending payments
  - Payment history per organization
- **New Database Tables**: `subscription_plans`, `subscriptions`, `subscription_payments`
- **New API Endpoints**: Registration, subscription management, payment verification
- **New Business Rules**: REG-001 to REG-004, SUB-001 to SUB-010, FG-001 to FG-005
- **New UI Pages**: `/register`, `/pricing`, `/settings/subscription`, `/admin/payments`
- **Module 11: Subscription & Billing** added to Project Overview
- **Phase 6** added to development phases (Weeks 17-18)

### Changed
- Updated `organizations` table with `subscription_status`, `trial_ends_at`, `registered_at` columns
- Updated Phase 1 tasks to include registration and plan seeding
- Updated Owner use cases to include registration and subscription management
- Synced `.cursorrules` with new entities, business rules, and feature gating patterns

### Technical Decisions
- **Manual payment verification (v1)** over automated payment gateways: Simpler to implement, fits Pakistani market where bank transfers are common. JazzCash/Easypaisa integration planned for v2.
- **Per-organization pricing** over per-station: Simpler billing model, encourages multi-station adoption.
- **Professional plan as trial default**: Lets users experience the full product before deciding which plan fits.
- **Read-only mode on expiry** over account lockout: Preserves user data and trust, encourages conversion.
- **Feature flags as JSONB**: Flexible, no schema changes needed when adding new features to plans.

### Why These Choices?
- Self-service registration is essential for SaaS growth (no manual onboarding bottleneck)
- 14-day trial is industry standard and sufficient for filling station owners to evaluate
- Manual payment verification suits the Pakistani market where digital payment adoption varies
- Tiered plans with feature gating create clear upgrade paths and revenue tiers

---

## [1.2.0] - 2026-02-08

### Added
- **Shadcn/ui component library** fully configured
  - Added components.json configuration file
  - Configured with "new-york" style, neutral base color
  - Integrated with existing Tailwind CSS setup
  - Added Button component as proof of concept
  - Added dependencies: class-variance-authority, tailwindcss-animate, @radix-ui/react-slot
- **@types/node** for TypeScript Node.js types support
- Updated Tailwind CSS to use @tailwindcss/vite plugin (v4 format)
- Enhanced .cursorrules with Shadcn/ui usage patterns

### Changed
- Updated index.css to use Tailwind v4 import syntax (`@import "tailwindcss"`)
- Updated vite.config.ts to include @tailwindcss/vite plugin
- Updated tsconfig.json with path aliases for Shadcn CLI
- Updated home page to demonstrate Shadcn Button variants

### Technical Decisions
- **Shadcn/ui over MUI/Ant Design**: Provides unstyled, customizable components that we own
- **@tailwindcss/vite over PostCSS**: Faster builds and better HMR
- **Radix UI primitives**: Industry-standard accessible component foundation

### Why These Choices?
- Shadcn/ui gives us full control over component code (no black box)
- Easier to customize for Pakistani market aesthetic
- Better accessibility out of the box (WCAG compliant)
- Smaller bundle size (only include components we use)
- Components live in our codebase, not node_modules

---

## [1.1.0] - 2026-02-07

### Added
- **Technical PRD** created with full specifications
- **Database schema** designed with 30+ tables
- **API specifications** for all core endpoints
- **Development phases** defined (5 phases, 16 weeks)

### Technical Decisions
- **Frontend:** React 18 + Vite + TanStack (Router, Query, Table)
- **UI Components:** Shadcn/ui + Tailwind CSS
- **Backend:** ASP.NET Core 8 with C# 12
- **ORM:** Entity Framework Core 8
- **Database:** PostgreSQL 16
- **Mobile:** PWA (Progressive Web App)
- **Hosting:** Local/AWS (flexible deployment)
- **Multi-tenancy:** Single database with StationId isolation

### Why These Choices?
- **TanStack over Redux**: Purpose-built for server state, less boilerplate
- **Shadcn/ui over MUI**: Unstyled, fully customizable for Pakistani aesthetic
- **EF Core over Dapper**: Better for complex domain with migrations
- **PostgreSQL over SQL Server**: Open source, JSON support, AWS RDS ready

---

## [1.0.0] - 2026-02-07


### Added
- Initial project documentation created
- **10 Core Modules** defined:
  1. User & Access Management
  2. Fuel Inventory & Tank Control
  3. Pump & Nozzle Operations
  4. Shift Management
  5. Finance & Accounts
  6. Pricing & Rate Management
  7. Reporting & Analytics
  8. Settings & Configuration
  9. Lubricants / Oil Shop
  10. SMS / Notifications

### Decisions Made
- **Granular permissions** chosen over broad access levels (for flexibility)
- **Multi-station support** under single Owner account
- **Nozzle-level tracking** instead of pump-level (for accurate shortage attribution)
- **Combined Finance module** (merged Ledger + Expenses for simpler mental model)
- **No shortage tolerance** – every rupee difference is flagged
- **Per-nozzleman balance due ledger** for shortage recovery
- **Bilingual support** (English + Urdu) from day one
- **Server-side auto-backup** (application-managed, not user-managed)

### Technical Decisions (Pending)
- Technology stack not yet finalized
- Database schema not yet designed
- API specifications not yet defined
