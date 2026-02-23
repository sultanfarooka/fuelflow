# Fuel Flow – Product Requirements Document (PRD)

> Technical specifications for building the Fuel Flow filling station management system.

---

## Document Info

| Property | Value |
|:--|:--|
| Version | 1.7.0 |
| Last Updated | 2026-02-23 |
| Status | Draft – Clean Architecture + CQRS/MediatR |

---

## Document Relationships

| Document | Purpose |
|:--|:--|
| **PRD** | Technical intent, architecture, API design, business rules |
| **EF Core Migrations** | Schema source of truth (exact tables, columns, constraints) |
| **Controllers / Swagger** | Endpoint source of truth (routes, methods); Swagger generated from code |
| **Project Overview** | Business requirements, module descriptions |
| **Implementation Status** | What's implemented, where to continue ([IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)) |
| **.cursorrules** | Quick reference for AI assistance |

---

## Table of Contents

1. [Technology Stack](#1-technology-stack)
2. [Architecture Overview](#2-architecture-overview)
3. [Database Schema](#3-database-schema)
4. [API Specifications](#4-api-specifications)
5. [Business Rules](#5-business-rules)
6. [UI Specifications](#6-ui-specifications)
7. [Development Phases](#7-development-phases)

---

## 1. Technology Stack

### 1.1 Frontend

| Component | Technology | Version | Purpose |
|:--|:--|:--|:--|
| Framework | React | 18.x | Component-based UI |
| Build Tool | Vite | 5.x | Fast dev server, optimized builds |
| Routing | TanStack Router | 1.x | Type-safe file-based routing |
| Data Fetching | TanStack Query | 5.x | Server state management, caching |
| Tables | TanStack Table | 8.x | Headless table for data grids |
| Forms | TanStack Form | Latest | Form state, validation (Zod adapter) |
| Validation | Zod | 3.x | Schema validation (shared with backend DTOs) |
| State | Zustand | 4.x | Lightweight client state |
| UI Components | Shadcn/ui | Latest | Accessible, customizable components |
| Styling | Tailwind CSS | 3.x | Utility-first CSS |
| Icons | Lucide React | Latest | Consistent icon set |
| Charts | Recharts | 2.x | Dashboard visualizations |
| PWA | Vite PWA Plugin | Latest | Service worker, offline support |
| i18n | react-i18next | Latest | English + Urdu support |

#### Why These Choices?

- **TanStack Router** over React Router: Type-safe, better DevTools, file-based routing convention
- **TanStack Query** over Redux: Purpose-built for server state, automatic caching/refetching
- **TanStack Form** over React Hook Form: Same ecosystem as Router/Query, framework-agnostic, works with Zod
- **Zustand** over Redux: Simpler API, minimal boilerplate, good for client-only state
- **Shadcn/ui** over MUI/Ant: Unstyled components you own, easier to customize for Pakistani aesthetic
- **Zod**: Can share validation schemas between frontend and generate OpenAPI specs

### 1.2 Backend

| Component | Technology | Version | Purpose |
|:--|:--|:--|:--|
| Framework | ASP.NET Core | 10.x | Web API |
| Language | C# | 12 | Backend logic |
| ORM | Entity Framework Core | 10.x | Database access |
| Auth | ASP.NET Identity + JWT | - | User authentication |
| CQRS / Messaging | MediatR | 14.x | In-process command/query dispatching |
| Validation | FluentValidation | 12.x | Request validation |
| Mapping | Mapperly | 3.x | DTO ↔ Entity mapping (source gen) |
| API Docs | Swagger / OpenAPI | - | Auto-generated API documentation |
| Background Jobs | Hangfire | 1.8.x | Scheduled reports, notifications |
| Logging | Serilog | 3.x | Structured logging |
| Caching | Redis (optional) | - | Session + query caching |

#### Why These Choices?

- **EF Core** over Dapper: Migrations, relationships, LINQ – better for complex domain
- **MediatR** for CQRS: Thin controllers, single-responsibility handlers, loose coupling between API and business logic
- **Mapperly** over AutoMapper: Source-generated, no runtime reflection, faster
- **FluentValidation**: Cleaner than data annotations, reusable validation rules
- **Hangfire**: Built-in dashboard, reliable job persistence in PostgreSQL

### 1.3 Database

| Component | Technology | Purpose |
|:--|:--|:--|
| Database | PostgreSQL | 16.x | Primary data store |
| Hosting | Local / AWS RDS | Production database |
| Migrations | EF Core Migrations | Schema versioning |

#### Why PostgreSQL?

- Open source, no license cost
- JSON support for flexible fields (dip charts, custom settings)
- Excellent performance for analytical queries (reports)
- AWS RDS support for managed hosting

### 1.4 Infrastructure

| Component | Technology | Purpose |
|:--|:--|:--|
| Containerization | Docker | Consistent environments |
| Orchestration | Docker Compose | Local multi-service setup |
| CI/CD | GitHub Actions | Automated testing & deployment |
| Hosting (Local) | IIS / Kestrel | On-premise option |
| Hosting (Cloud) | AWS (ECS / App Runner) | Scalable cloud option |
| File Storage | AWS S3 / Local disk | Invoice images, receipts |
| SMS Gateway | Telenor/Jazz API | Pakistani SMS delivery |

### 1.5 Development Tools

| Tool | Purpose |
|:--|:--|
| VS Code / Rider | IDE |
| ESLint + Prettier | Frontend linting & formatting |
| dotnet format | Backend formatting |
| Husky | Pre-commit hooks |

---

## 2. Architecture Overview

### 2.1 High-Level Architecture

The backend uses **Clean Architecture** (also known as Onion Architecture), organized into 4 separate .NET projects. Dependencies flow inward — inner layers never reference outer layers.

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  React SPA (PWA)                                                │
│  ├── TanStack Router (pages)                                    │
│  ├── TanStack Query (API calls)                                 │
│  └── Zustand (client state: theme, language, sidebar)           │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS (REST API)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                 FuelFlow.Api (Presentation)                      │
├─────────────────────────────────────────────────────────────────┤
│  ├── Controllers (thin, send Commands/Queries via MediatR)        │
│  ├── Program.cs (composition root, DI wiring)                   │
│  └── Middleware (error handling, auth pipeline)                  │
└────────────────────────┬────────────────────────────────────────┘
                         │ depends on
          ┌──────────────┴──────────────┐
          ▼                             ▼
┌──────────────────────┐  ┌──────────────────────────────────────┐
│ FuelFlow.Application │  │      FuelFlow.Infrastructure         │
├──────────────────────┤  ├──────────────────────────────────────┤
│ Commands & Queries    │  │ EF Core (AppDbContext, Migrations)   │
│ Repository interfaces│  │ Command/Query Handlers (MediatR)      │
│ DTOs & Validators    │  │ Repository implementations           │
│ Common (Result type) │  │ Identity + JWT auth                  │
└──────────┬───────────┘  │ Background Jobs (Hangfire)           │
           │              │ External services (SMS, S3)           │
           │              └──────────────┬───────────────────────┘
           │ depends on                  │ depends on
           ▼                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  FuelFlow.Domain (Core)                          │
├─────────────────────────────────────────────────────────────────┤
│  ├── Entities (pure C# classes, no framework dependencies)      │
│  ├── Enums (Role, ShiftStatus, SubscriptionStatus, etc.)        │
│  └── Common (BaseEntity, IAuditableEntity)                      │
└─────────────────────────────────────────────────────────────────┘
                         │ EF Core
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                        PostgreSQL 16                             │
├─────────────────────────────────────────────────────────────────┤
│  ├── Tables (normalized schema)                                 │
│  ├── Views (reporting queries)                                  │
│  └── Indexes (performance optimization)                         │
└─────────────────────────────────────────────────────────────────┘
```

#### Why Clean Architecture?

- **Dependency inversion**: Domain and Application layers have zero knowledge of EF Core, PostgreSQL, or HTTP. If we swap the database, only Infrastructure changes.
- **Testability**: Business logic in Application/Domain can be unit tested without a database or web server.
- **Compile-time enforcement**: Separate .csproj files mean invalid dependencies won't compile.
- **Scalability**: 10+ modules with complex business rules benefit from clear separation of concerns.

#### Project Dependency Rules

| Project | Can Reference | Cannot Reference |
|:--|:--|:--|
| FuelFlow.Domain | Nothing | Everything else |
| FuelFlow.Application | Domain | Infrastructure, Api |
| FuelFlow.Infrastructure | Application, Domain | Api |
| FuelFlow.Api | Application, Infrastructure | — (composition root) |

#### CQRS & MediatR Pattern

The backend uses **CQRS** (Command Query Responsibility Segregation) with **MediatR** for in-process messaging:

| Concept | Purpose |
|:--|:--|
| **Command** | Operation that changes state (e.g., `RegisterCommand`, `LoginCommand`) |
| **Query** | Read-only operation (e.g., `GetCurrentUserQuery`) |
| **Handler** | Implements business logic for a command or query |
| **MediatR** | Dispatches commands/queries to handlers — controllers never call handlers directly |

**Request flow:** `HTTP Request → Controller → MediatR.Send(Command/Query) → Handler → Result → Controller → HTTP Response`

**Why CQRS + MediatR?**
- **Thin controllers**: Controllers only receive request, send command/query, return response — no business logic
- **Single responsibility**: Each handler does one thing; easy to test and maintain
- **Loose coupling**: Controllers depend on `IMediator`, not concrete handlers or services
- **Consistent pattern**: All operations follow the same structure (Command/Query → Handler → Result)

### 2.2 Project Structure

#### Backend (Clean Architecture — 4 Projects)

```
FuelFlow.sln
│
├── FuelFlow.Domain/                # Core business entities (NO external dependencies)
│   ├── Entities/
│   │   ├── BaseEntity.cs           # Id, CreatedAt, UpdatedAt
│   │   ├── Organization.cs
│   │   ├── Station.cs
│   │   ├── User.cs
│   │   └── ...
│   ├── Enums/
│   │   ├── UserRole.cs
│   │   ├── ShiftStatus.cs
│   │   ├── SubscriptionStatus.cs
│   │   └── ...
│   └── Common/
│       └── IAuditableEntity.cs
│
├── FuelFlow.Application/           # Commands, queries, interfaces, DTOs
│   ├── Features/
│   │   ├── Auth/
│   │   │   ├── Commands/
│   │   │   │   ├── LoginCommand.cs
│   │   │   │   ├── RegisterCommand.cs
│   │   │   │   └── RefreshTokenCommand.cs
│   │   │   └── Queries/
│   │   │       └── GetCurrentUserQuery.cs
│   │   └── ...
│   ├── Interfaces/
│   │   ├── IRepository.cs          # Generic repository interface
│   │   ├── IUnitOfWork.cs          # Transaction management
│   │   └── ...
│   ├── DTOs/
│   │   ├── Auth/
│   │   │   ├── RegisterRequest.cs
│   │   │   ├── LoginRequest.cs
│   │   │   ├── RefreshTokenRequest.cs
│   │   │   └── AuthResponse.cs
│   │   └── ...
│   ├── Validators/                 # FluentValidation rules
│   │   ├── LoginRequestValidator.cs
│   │   ├── RegisterRequestValidator.cs
│   │   └── ...
│   └── Common/
│       └── Result.cs               # Result<T> type for handler responses
│
├── FuelFlow.Infrastructure/        # Handlers, EF Core, JWT, etc.
│   ├── Features/
│   │   ├── Auth/
│   │   │   ├── Commands/
│   │   │   │   ├── LoginCommandHandler.cs
│   │   │   │   ├── RegisterCommandHandler.cs
│   │   │   │   └── RefreshTokenCommandHandler.cs
│   │   │   └── Queries/
│   │   │       └── GetCurrentUserQueryHandler.cs
│   │   └── ...
│   ├── Data/
│   │   ├── AppDbContext.cs
│   │   ├── Migrations/
│   │   └── Configurations/         # EF Core Fluent API (entity → table mapping)
│   ├── Repositories/
│   │   └── Repository.cs           # Generic repository implementation
│   ├── Services/
│   │   ├── JwtTokenService.cs     # JWT generation, refresh token hashing
│   │   ├── CurrentUserService.cs  # ICurrentUserService (userId, role, orgId from JWT)
│   │   └── RequestContextService.cs # IRequestContextService (IP, UserAgent from request)
│   └── DependencyInjection.cs      # Registers MediatR handlers + Infrastructure services
│
└── FuelFlow.Api/                   # HTTP entry point (composition root)
    ├── Controllers/
    │   ├── AuthController.cs
    │   ├── StationsController.cs
    │   └── ...
    ├── Middleware/
    │   └── ExceptionHandlingMiddleware.cs
    ├── Program.cs                  # DI wiring, pipeline config
    ├── appsettings.json
    └── appsettings.Development.json
```

#### Frontend (React)

```
fuel-flow-web/
├── src/
│   ├── routes/            # TanStack Router file-based routes
│   │   ├── __root.tsx
│   │   ├── index.tsx
│   │   ├── login.tsx
│   │   ├── dashboard/
│   │   │   └── index.tsx
│   │   ├── stations/
│   │   │   ├── index.tsx
│   │   │   └── $stationId.tsx
│   │   └── ...
│   ├── components/
│   │   ├── ui/            # Shadcn components
│   │   ├── forms/         # Form components
│   │   └── layout/        # Shell, sidebar, header
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── queries/       # TanStack Query hooks
│   ├── lib/
│   │   ├── api.ts         # Axios/fetch config
│   │   ├── utils.ts
│   │   └── validators.ts  # Zod schemas
│   ├── stores/            # Zustand stores
│   └── locales/           # i18n translations
│       ├── en.json
│       └── ur.json
├── public/
│   └── manifest.json      # PWA manifest
└── vite.config.ts
```

### 2.3 Multi-Tenancy Approach

The system supports multiple stations under one Owner. We use a **single database with tenant isolation**:

| Approach | Description |
|:--|:--|
| Strategy | Shared database, shared schema |
| Isolation | All tables have `StationId` foreign key |
| Queries | Global filter applied via EF Core query filters |
| Owner View | Aggregates data across all owned stations |

**Why this approach?**
- Simpler deployment (one database)
- Easy cross-station reporting for Owner
- Cost-effective (no separate DBs per station)

---

## 3. Database Schema

> **Source of truth:** The exact schema is defined in EF Core migrations (`FuelFlow.Infrastructure/Migrations/`). The tables below are conceptual. Identity uses `AspNetUsers`, `AspNetRoles`, etc.; the `users` table here represents the domain concept.

### 3.1 Entity Relationship Overview

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    Owner     │──1:N──│   Station    │──1:N──│     Tank     │
└──────────────┘       └──────────────┘       └──────────────┘
                              │                      │
                             1:N                    1:N
                              ▼                      ▼
                       ┌──────────────┐       ┌──────────────┐
                       │    User      │       │   Nozzle     │
                       └──────────────┘       └──────────────┘
                              │                      │
                             1:N                    1:N
                              ▼                      ▼
                       ┌──────────────┐       ┌──────────────┐
                       │    Shift     │──1:N──│MeterReading  │
                       └──────────────┘       └──────────────┘
```

### 3.2 Key Entities (Conceptual)

| Entity | Key Fields | Notes |
|:--|:--|:--|
| `organizations` | id, name, email, subscription_status, trial_ends_at | Root tenant |
| `stations` | id, organization_id, name, address, is_active | Per-org stations |
| `AspNetUsers` | id, email, full_name, role, organization_id | Identity; extends domain User |
| `refresh_tokens` | id, user_id, token_hash, expires_at, revoked_at, ip_address, user_agent, device_id | DB-backed; hashed only |
| `user_stations` | user_id, station_id | Many-to-many access |
| `tanks` | id, station_id, fuel_type_id, capacity_liters | Underground storage |
| `nozzles` | id, station_id, tank_id | Dispensing points |
| `shifts` | id, station_id, status, opening_cash | Shift lifecycle |
| `meter_readings` | id, nozzle_id, shift_id, reading_type, totalizer_value | Sales calculation |
| `credit_customers` | id, station_id, name, credit_limit, current_balance | Udhaar customers |
| `subscriptions` | id, organization_id, plan_id, status | One active per org |

Additional entities (fuel_types, dip_charts, dip_readings, fuel_deliveries, shift_assignments, nozzleman_balances, credit_transactions, suppliers, fuel_prices, products, audit_logs, notifications, subscription_plans, subscription_payments, etc.) are defined in EF Core migrations.

### 3.3 Important Rules

| Area | Rule |
|:--|:--|
| **Refresh tokens** | Store only hashed tokens (never plain text); plain token sent to client only at creation |
| **Refresh tokens** | 7-day default expiry (configurable) |
| **Refresh tokens** | Rotation on refresh: each refresh issues new token, revokes old; reuse = possible breach → 401 |
| **Refresh tokens** | Session tracking: ip_address, user_agent (from request), optional device_id (from client) |
| **Multi-tenancy** | All tenant tables have station_id or organization_id; EF Core query filters enforce isolation |
| **Subscriptions** | One active subscription per organization; trial = 14 days from registration |
| **Shifts** | Only one open shift per station at a time; opening meter ≥ last closing |
| **Credit** | Sale blocked if customer at/above credit limit |
| **Audit** | Price changes, user create/delete, stock adjustments, credit deletions logged; never deleted |

Indexes and exact column definitions are defined in EF Core migrations.

---

## 4. API Specifications

### 4.1 API Conventions

| Aspect | Convention |
|:--|:--|
| Base URL | `/api/v1` |
| Format | JSON |
| Auth | JWT via HTTP-only cookies (access_token, refresh_token); JSON responses omit tokens; client sends `credentials: include` |
| Errors | RFC 7807 Problem Details (see example below) |
| Pagination | `?page=1&pageSize=20` |
| Sorting | `?sortBy=name&sortOrder=asc` |
| Filtering | `?status=active&search=xyz` |

**Error response example (RFC 7807):**
```json
{
  "type": "https://api.fuelflow.pk/errors/validation",
  "title": "Validation Error",
  "status": 400,
  "detail": "One or more validation errors occurred.",
  "errors": {
    "email": ["Email is already registered."],
    "password": ["Password must be at least 8 characters."]
  }
}
```

### 4.2 Authentication Endpoints

| Endpoint | Description | Status |
|:--|:--|:--|
| `POST /api/v1/auth/register` | Owner self-registration + first station (public) | Implemented |
| `POST /api/v1/auth/login` | Email/password login | Implemented |
| `POST /api/v1/auth/refreshToken` | Exchange refresh token for new access + refresh tokens (rotation) | Implemented |
| `POST /api/v1/auth/verify-email` | Verify email using token from link | Implemented |
| `POST /api/v1/auth/resend-verification` | Resend verification email | Implemented |
| `POST /api/v1/auth/login-pin` | PIN quick login | Planned |
| `POST /api/v1/auth/forgot-password` | Request password reset (sends email with token link) | Implemented |
| `POST /api/v1/auth/reset-password` | Reset password using token from link | Implemented |
| `POST /api/v1/auth/logout` | Revoke refresh token (from cookie or body), clear auth cookies | Implemented |
| `GET /api/v1/auth/me` | Get current user profile | Implemented |

**Refresh token flow (implemented):**
- Login/Register set `access_token` and `refresh_token` in HTTP-only cookies; JSON response returns `user`, `expiresIn`, `subscription` (no tokens)
- `POST /auth/refreshToken` reads refresh token from cookie; validates, rotates (revokes old, issues new), sets new cookies
- Session tracking: `ip_address`, `user_agent` (from request), optional `device_id` (from client)

**Password reset flow (implemented):**
- `POST /auth/forgot-password` accepts `{ "email": "..." }`; sends reset link via email (generic success for security)
- Reset link: `{FrontendUrl}/reset-password?token=...&userId=...`; token expires in 24 hours (DataProtectionTokenProviderOptions)
- `POST /auth/reset-password` accepts `{ "userId", "token", "newPassword" }`; validates token, updates password

### 4.3 Dashboard Endpoints

| Endpoint | Description | Status |
|:--|:--|:--|
| `GET /api/v1/dashboard/summary` | Dashboard summary (Owner, Manager only) | Implemented |

### 4.4 Subscription & Billing Endpoints

#### Plans (public)
```
GET    /api/v1/subscription/plans          # List available plans with pricing
```

#### Subscription Management (Owner only)
```
GET    /api/v1/subscription                # Get current subscription & plan details
POST   /api/v1/subscription/upgrade        # Request plan change (upgrade/downgrade)
GET    /api/v1/subscription/usage          # Current usage vs plan limits
POST   /api/v1/subscription/payments       # Submit payment proof (bank transfer receipt)
GET    /api/v1/subscription/payments       # Payment history for this organization
```

#### Admin – Payment Verification (SuperAdmin only)
```
GET    /api/v1/admin/payments/pending      # List pending payment verifications
POST   /api/v1/admin/payments/{id}/verify  # Approve or reject a payment
```

### 4.5 Core Resource Endpoints

#### Stations
```
GET    /api/v1/stations                # List stations (filtered by access)
GET    /api/v1/stations/{id}           # Get station details
POST   /api/v1/stations                # Create station (Owner only)
PUT    /api/v1/stations/{id}           # Update station
DELETE /api/v1/stations/{id}           # Deactivate station
```

#### Tanks
```
GET    /api/v1/stations/{stationId}/tanks
GET    /api/v1/tanks/{id}
POST   /api/v1/stations/{stationId}/tanks
PUT    /api/v1/tanks/{id}
DELETE /api/v1/tanks/{id}

POST   /api/v1/tanks/{id}/dip-chart    # Upload dip chart entries
GET    /api/v1/tanks/{id}/dip-chart    # Get dip chart
POST   /api/v1/tanks/{id}/dip-reading  # Record dip reading
GET    /api/v1/tanks/{id}/stock        # Get current stock (calculated)
```

#### Nozzles
```
GET    /api/v1/stations/{stationId}/nozzles
POST   /api/v1/stations/{stationId}/nozzles
PUT    /api/v1/nozzles/{id}
DELETE /api/v1/nozzles/{id}
```

#### Shifts
```
GET    /api/v1/stations/{stationId}/shifts           # List shifts
GET    /api/v1/shifts/{id}                           # Get shift details
POST   /api/v1/stations/{stationId}/shifts           # Open new shift
PUT    /api/v1/shifts/{id}/close                     # Close shift
POST   /api/v1/shifts/{id}/meter-reading             # Record meter reading
POST   /api/v1/shifts/{id}/assign-nozzleman          # Assign nozzleman to nozzle
GET    /api/v1/shifts/{id}/summary                   # Get shift summary/settlement
```

#### Fuel Deliveries
```
GET    /api/v1/stations/{stationId}/deliveries
POST   /api/v1/stations/{stationId}/deliveries
GET    /api/v1/deliveries/{id}
PUT    /api/v1/deliveries/{id}
```

#### Credit Customers
```
GET    /api/v1/stations/{stationId}/customers
POST   /api/v1/stations/{stationId}/customers
GET    /api/v1/customers/{id}
PUT    /api/v1/customers/{id}
GET    /api/v1/customers/{id}/transactions
POST   /api/v1/customers/{id}/sale                   # Record credit sale
POST   /api/v1/customers/{id}/payment                # Record payment
GET    /api/v1/customers/{id}/statement              # Generate statement
```

#### Expenses
```
GET    /api/v1/stations/{stationId}/expenses
POST   /api/v1/stations/{stationId}/expenses
GET    /api/v1/expenses/{id}
PUT    /api/v1/expenses/{id}
DELETE /api/v1/expenses/{id}
GET    /api/v1/expense-categories                    # List categories
```

#### Pricing
```
GET    /api/v1/stations/{stationId}/prices           # Current prices
POST   /api/v1/stations/{stationId}/prices           # Set new price
GET    /api/v1/stations/{stationId}/prices/history   # Price history
GET    /api/v1/stations/{stationId}/promotions       # Active promotions
POST   /api/v1/stations/{stationId}/promotions       # Create promotion
```

#### Reports
```
GET    /api/v1/stations/{stationId}/reports/daily-sales
GET    /api/v1/stations/{stationId}/reports/stock
GET    /api/v1/stations/{stationId}/reports/profit-loss
GET    /api/v1/stations/{stationId}/reports/receivables
GET    /api/v1/stations/{stationId}/reports/payables
GET    /api/v1/organization/reports/all-stations     # Owner consolidated view
```

#### Lubricants/Products
```
GET    /api/v1/stations/{stationId}/products
POST   /api/v1/stations/{stationId}/products
PUT    /api/v1/products/{id}
POST   /api/v1/products/{id}/stock-in                # Receive stock
POST   /api/v1/stations/{stationId}/product-sales    # Record sale
```

### 4.6 Sample Request/Response

#### Owner Registration
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
  "data": {
    "message": "Please check your email to verify your account."
  }
}
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "manager@station.com",
  "password": "SecurePass123",
  "deviceId": "optional-browser-fingerprint"
}
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
      "stations": [
        {
          "id": "660e8400-e29b-41d4-a716-446655440001",
          "name": "Al-Madina Filling Station"
        }
      ]
    },
    "subscription": { "plan": "professional", "status": "trial" }
  }
}
```

Tokens are set in HTTP-only cookies (`access_token`, `refresh_token`); not returned in JSON.

#### Refresh Token
```http
POST /api/v1/auth/refreshToken
Content-Type: application/json

{
  "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2g...",
  "deviceId": "optional-browser-fingerprint"
}
```

Response: Same shape as Login (new cookies set; JSON returns `expiresIn`, `user`, `subscription`). Old refresh token is revoked.

#### Record Meter Reading
```http
POST /api/v1/shifts/{shiftId}/meter-reading
Content-Type: application/json
Authorization: Bearer {token}

{
  "nozzleId": "770e8400-e29b-41d4-a716-446655440002",
  "readingType": "closing",
  "totalizerValue": 1234567.50,
  "imageUrl": "https://s3.../meter-photo.jpg"
}
```

---

## 5. Business Rules

### 5.1 Shift Management

| Rule ID | Description |
|:--|:--|
| SH-001 | Only one shift can be open per station at a time |
| SH-002 | Opening meter reading must be ≥ last closing reading |
| SH-003 | Shift cannot be closed until all assigned nozzles have closing readings |
| SH-004 | Shortage = Calculated Sales - (Cash + Credit + Card + Digital) |
| SH-005 | Any shortage amount is added to nozzleman's balance due |
| SH-006 | Excess amount is logged but not deducted from balance |

### 5.2 Pricing

| Rule ID | Description |
|:--|:--|
| PR-001 | Only one active price per fuel type per station |
| PR-002 | Price changes require confirmation (type twice) |
| PR-003 | Price changes trigger notification to all station users |
| PR-004 | Sales during price change split by time, calculated at respective rates |
| PR-005 | Customer special rates applied automatically on credit sales |

### 5.3 Inventory

| Rule ID | Description |
|:--|:--|
| INV-001 | Stock = Opening Dip + Deliveries - Sales (calculated) |
| INV-002 | Physical stock from closing dip reading |
| INV-003 | Variance = Physical Stock - Calculated Stock |
| INV-004 | Variance exceeding threshold triggers alert |
| INV-005 | Short delivery alerts sent to Owner immediately |

### 5.4 Credit Management

| Rule ID | Description |
|:--|:--|
| CR-001 | Credit sale blocked if customer at/above credit limit |
| CR-002 | Partial payments reduce outstanding balance |
| CR-003 | Customer balance = Sum(sales) - Sum(payments) |
| CR-004 | Aging calculated from transaction date |

### 5.5 Audit

| Rule ID | Description |
|:--|:--|
| AUD-001 | All price changes logged with before/after values |
| AUD-002 | All user create/delete actions logged |
| AUD-003 | Manual stock adjustments logged with reason |
| AUD-004 | Credit entry deletions logged |
| AUD-005 | Audit logs never deleted (retention: owner-configurable) |

### 5.6 Registration

| Rule ID | Description |
|:--|:--|
| REG-001 | Email must be unique across all users |
| REG-002 | Registration creates Owner user only. Organization and first station are added after first login (onboarding) |
| REG-003 | Phone number validated for Pakistani format (+92XXXXXXXXXX) |
| REG-004 | Email must be verified before login. Verification link sent on registration. |

### 5.7 Subscription & Billing

| Rule ID | Description |
|:--|:--|
| SUB-001 | Each organization has exactly one active subscription at a time |
| SUB-002 | Trial period is 14 days from registration date |
| SUB-003 | Trial gives Professional plan features (so users experience the full product) |
| SUB-004 | When trial expires, account becomes read-only (can view data, cannot create/edit) |
| SUB-005 | Payment verification is manual — admin approves bank transfer proof |
| SUB-006 | Subscription activates only after payment is verified |
| SUB-007 | 3-day grace period after subscription expires before read-only mode |
| SUB-008 | Downgrade blocked if current usage exceeds target plan limits |
| SUB-009 | Annual billing gives ~17% discount (2 months free) |
| SUB-010 | Feature gating enforced at API level (not just UI) |

### 5.8 Feature Gating

| Rule ID | Description |
|:--|:--|
| FG-001 | Station count checked on station creation against plan's `max_stations` |
| FG-002 | User count checked on user creation against plan's `max_users` |
| FG-003 | Module access checked via plan's `features` JSONB flags |
| FG-004 | Expired/cancelled subscriptions allow read-only access to existing data |
| FG-005 | Owner always sees upgrade prompts for gated features |

#### Plan Tiers

| Plan | Max Stations | Max Users | Key Features |
|:--|:--|:--|:--|
| Starter | 1 | 5 | Core modules (shifts, inventory, pricing, credit) |
| Professional | 3 | 15 | All modules + SMS + report exports + promotions |
| Enterprise | Unlimited | Unlimited | Everything + priority support + custom branding |

---

## 6. UI Specifications

### 6.1 Page Structure

| Page | Route | Access |
|:--|:--|:--|
| Registration | `/register` | Public |
| Pricing | `/pricing` | Public |
| Login | `/login` | Public |
| Dashboard | `/dashboard` | All users |
| All Stations | `/stations` | Owner |
| Station Detail | `/stations/:id` | Owner, Manager |
| Shift Management | `/stations/:id/shifts` | Manager, Nozzleman |
| Inventory | `/stations/:id/inventory` | Manager |
| Finance | `/stations/:id/finance` | Manager |
| Reports | `/stations/:id/reports` | Owner, Manager |
| Settings | `/settings` | Owner |
| Subscription | `/settings/subscription` | Owner |
| Payment Verification | `/admin/payments` | SuperAdmin |

#### Registration Flow

| Step | Content | Validation |
|:--|:--|:--|
| 1 – Owner Info | Full name, email, phone, password | Email unique, phone +92 format, password min 6 chars |
| 2 – Success | Welcome message + verify email prompt | Redirect to login after verification |

Organization and first station are added after first login during onboarding.

#### Subscription Status UI

- **Trial banner**: Shown at top of dashboard with days remaining count
- **Upgrade prompts**: Locked icon + "Upgrade to unlock" on gated features
- **Subscription page**: Plan details, usage vs limits, payment history, upgrade/downgrade

### 6.2 Component Library

Using Shadcn/ui components:
- **DataTable**: TanStack Table + Shadcn styling
- **Forms**: TanStack Form + Zod validation
- **Modals**: Dialog component for confirmations
- **Toasts**: Sonner for notifications
- **Charts**: Recharts with consistent theme

### 6.3 Responsive Breakpoints

| Breakpoint | Width | Usage |
|:--|:--|:--|
| Mobile | < 640px | Nozzleman entry screens |
| Tablet | 640px - 1024px | Manager on tablet |
| Desktop | > 1024px | Full dashboard experience |

### 6.4 PWA Features

| Feature | Implementation |
|:--|:--|
| Offline | Service worker caches app shell |
| Install | Add to home screen prompt |
| Push | Web push for notifications (future) |

---

## 7. Development Phases

### Phase 1: Foundation (Weeks 1-4)

| ID | Task | Status |
|:--|:--|:--|
| 1.1 | Project setup (React + Vite + TanStack) | ✅ |
| 1.2 | Backend setup (ASP.NET Core + EF Core) | ✅ |
| 1.3 | Database setup (PostgreSQL + migrations) | ✅ |
| 1.4 | Authentication system (JWT + refresh tokens) | ✅ |
| 1.4b | Owner registration endpoint (creates org + user + station + trial subscription) | ✅ |
| 1.4c | Subscription plan seeding (Starter, Professional, Enterprise) | ⬜ |
| 1.5 | Role-based authorization middleware | ✅ |
| 1.6 | Organization & Station CRUD | ⬜ |
| 1.7 | User management (create, permissions) | ⬜ |
| 1.8 | Basic UI shell (layout, sidebar, navigation) | ⬜ |
| 1.8b | Registration page (multi-step form) | ⬜ |
| 1.8c | Pricing page (plan comparison, monthly/yearly toggle) | ⬜ |

### Phase 2: Core Operations (Weeks 5-8)

| ID | Task | Status |
|:--|:--|:--|
| 2.1 | Tank CRUD & configuration | ⬜ |
| 2.2 | Dip chart upload & management | ⬜ |
| 2.3 | Nozzle CRUD & tank linking | ⬜ |
| 2.4 | Shift open workflow | ⬜ |
| 2.5 | Nozzleman assignment to nozzles | ⬜ |
| 2.6 | Meter reading entry (opening/closing) | ⬜ |
| 2.7 | Dip reading entry | ⬜ |
| 2.8 | Sales calculation engine | ⬜ |
| 2.9 | Shift close & settlement | ⬜ |
| 2.10 | Shortage/excess tracking | ⬜ |
| 2.11 | Fuel delivery recording | ⬜ |

### Phase 3: Finance (Weeks 9-12)

| ID | Task | Status |
|:--|:--|:--|
| 3.1 | Credit customer CRUD | ⬜ |
| 3.2 | Credit sale recording | ⬜ |
| 3.3 | Payment recording | ⬜ |
| 3.4 | Customer statement generation | ⬜ |
| 3.5 | Supplier CRUD | ⬜ |
| 3.6 | Supplier transaction recording | ⬜ |
| 3.7 | Expense categories setup | ⬜ |
| 3.8 | Expense entry | ⬜ |
| 3.9 | Fuel pricing management | ⬜ |
| 3.10 | Price change notifications | ⬜ |
| 3.11 | Customer special rates | ⬜ |
| 3.12 | Promotional pricing | ⬜ |

### Phase 4: Reporting (Weeks 13-14)

| ID | Task | Status |
|:--|:--|:--|
| 4.1 | Daily sales report | ⬜ |
| 4.2 | Stock/inventory report | ⬜ |
| 4.3 | Receivables aging report | ⬜ |
| 4.4 | Payables report | ⬜ |
| 4.5 | Profit & loss report | ⬜ |
| 4.6 | Dashboard widgets (sales, stock, alerts) | ⬜ |
| 4.7 | All-stations consolidated view | ⬜ |
| 4.8 | Report export (PDF, Excel) | ⬜ |
| 4.9 | Scheduled email reports | ⬜ |

### Phase 5: Polish (Weeks 15-16)

| ID | Task | Status |
|:--|:--|:--|
| 5.1 | Lubricants/products CRUD | ⬜ |
| 5.2 | Product stock management | ⬜ |
| 5.3 | Product sales | ⬜ |
| 5.4 | Notification settings UI | ⬜ |
| 5.5 | SMS gateway integration | ⬜ |
| 5.6 | In-app notification system | ⬜ |
| 5.7 | PWA setup (manifest, service worker) | ⬜ |
| 5.8 | Urdu localization | ⬜ |
| 5.9 | Audit log viewer | ⬜ |
| 5.10 | End-to-end testing | ⬜ |
| 5.11 | Bug fixes & polish | ⬜ |

### Phase 6: Subscription & Billing (Weeks 17-18)

| ID | Task | Status |
|:--|:--|:--|
| 6.1 | Subscription management UI (current plan, usage, upgrade/downgrade) | ⬜ |
| 6.2 | Payment submission flow (bank transfer receipt upload) | ⬜ |
| 6.3 | Admin payment verification panel | ⬜ |
| 6.4 | Feature gating middleware (API-level enforcement) | ⬜ |
| 6.5 | Trial expiry notification jobs (Hangfire) | ⬜ |
| 6.6 | Subscription expiry & grace period handling | ⬜ |
| 6.7 | Read-only mode for expired subscriptions | ⬜ |
| 6.8 | JazzCash / Easypaisa integration (future) | ⬜ |

---

*Document Version: 1.7.0*  
*Last Updated: 2026-02-23*
