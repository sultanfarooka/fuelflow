# routes/ — TanStack Router File-Based Routing

Routes are auto-discovered from the file system by the TanStack Router Vite plugin. `routeTree.gen.ts` is auto-generated — **never edit it manually**.

## Page Structure (Route → Access)

Authoritative mapping of routes to the role(s) allowed to see them. Reference [`docs/MODULES.md`](../../../docs/MODULES.md) for the underlying feature IDs.

| Page | Route | Access | Module |
|---|---|---|---|
| Landing | `/` | Public | — |
| Pricing / Plan Comparison | `/pricing` | Public | [M11-F08](../../../docs/MODULES.md#m11-f08--plan-comparison--pricing-page) |
| Registration | `/auth/register` | Public | [M01-F01](../../../docs/MODULES.md#m01-f01--self-service-registration) |
| Login | `/auth/login` | Public | [M01-F03](../../../docs/MODULES.md#m01-f03--login--session) |
| Email verification | `/auth/verify-email`, `/auth/check-email-register` | Public | [M01-F02](../../../docs/MODULES.md#m01-f02--email-verification) |
| Password reset | `/auth/forgot-password`, `/auth/reset-password`, `/auth/check-email-reset` | Public | [M01-F04](../../../docs/MODULES.md#m01-f04--password-recovery) |
| Onboarding (org + first station) | `/onboarding` | Authenticated, no org | [M08-F01](../../../docs/MODULES.md#m08-f01--station-profile) |
| Org Dashboard | `/dashboard` | All authenticated | [M07-F06](../../../docs/MODULES.md#m07-f06--consolidated-all-stations-view) |
| Station detail | `/dashboard/station/:stationId` | Owner, Manager | — |

> **M07-F06 note:** Single-station orgs are auto-redirected to their station dashboard via `beforeLoad` in `dashboard/index.tsx`. Multi-station orgs see a station-card grid with no sidebar — just a minimal top bar (org name, user menu, language/theme toggles). The sidebar renders only for `/dashboard/station/*` routes.
| Station setup wizard | `/dashboard/station/:stationId/setup` | Owner, Manager | [M08-F02](../../../docs/MODULES.md#m08-f02--tank-configuration), [M08-F03](../../../docs/MODULES.md#m08-f03--nozzle-configuration) |
| Shifts | `/dashboard/station/:stationId/shifts` (stub) | Owner, Manager, Custom | [M04](../../../docs/MODULES.md#m04--shift-management) |
| Nozzle Operations | `/dashboard/station/:stationId/nozzles` (stub) | Owner, Manager, Custom | [M03](../../../docs/MODULES.md#m03--nozzle-operations) |
| Fuel Inventory | `/dashboard/station/:stationId/inventory` (stub) | Owner, Manager, Custom | [M02](../../../docs/MODULES.md#m02--fuel-inventory--tank-control) |
| Fuel Pricing | `/dashboard/station/:stationId/pricing` (stub) | Owner, Manager, Custom | [M06](../../../docs/MODULES.md#m06--fuel-pricing) |
| Credit Customers | `/dashboard/station/:stationId/credit` (stub) | Owner, Manager, Custom | [M15](../../../docs/MODULES.md#m15--credit-customers) |
| Finance & Accounts | `/dashboard/station/:stationId/finance` (stub) | Owner, Manager, Accountant, Custom | [M05](../../../docs/MODULES.md#m05--finance--accounts) |
| Reports | `/dashboard/station/:stationId/reports` (stub) | Owner, Manager, Accountant, Custom | [M07-F01..F06](../../../docs/MODULES.md#m07--reporting-analytics--platform-ui) |
| Users & Access | `/dashboard/station/:stationId/admin/users` (stub) | Owner | [M01-F05..F07](../../../docs/MODULES.md#m01-f05--user-management) |
| Staff & Payroll | `/dashboard/station/:stationId/admin/staff` (stub, Pro+) | Owner | [M13](../../../docs/MODULES.md#m13--staff--payroll) |
| Lubricants / Oil Shop | `/dashboard/station/:stationId/admin/lubricants` (stub, Pro+) | Owner | [M09](../../../docs/MODULES.md#m09--lubricants--oil-shop) |
| Settings | `/settings` (stub) | Owner, Manager | [M08](../../../docs/MODULES.md#m08--settings--configuration) |
| Subscription | `/settings/subscription` (planned) | Owner | [M11-F01..F07](../../../docs/MODULES.md#m11--subscription--billing) |
| Audit log viewer | `/settings/audit` (planned) | Owner | [M01-F08-R06](../../../docs/MODULES.md#m01-f08--audit-trail) |
| Admin: Payment verification | `/admin/payments` (planned) | SuperAdmin | [M11-F03](../../../docs/MODULES.md#m11-f03--payment--verification) |

**Role enforcement** is two-layered:

1. **`beforeLoad()` guard** (this file's pattern) — short-circuits navigation client-side based on `useAuthStore.getState()`.
2. **API-level enforcement** — every request is authorised in the backend regardless of what the UI did. Frontend role checks are UX, not security.

## Registration Flow

Multi-step form spread across three routes (see [M01-F01](../../../docs/MODULES.md#m01-f01--self-service-registration)):

| Step | Route | Content |
|---|---|---|
| 1 | `/auth/register` | Owner info form (full name, email, phone, password) — single page, multi-step in-component |
| 2 | `/auth/check-email-register` | "Check your email" confirmation screen |
| 3 | `/auth/verify-email?token=…` | Verification endpoint hit; on success → redirect to `/auth/login` |

Organization and first station are NOT collected at registration — they're added after first login during onboarding (`/onboarding`).

## Onboarding Flow

After first verified login, users without an organization are redirected to `/onboarding` (enforced by `dashboard/route.tsx`'s `beforeLoad`). The `/onboarding` route hosts a 9-step wizard (M12-F01) that takes a new Owner from organization creation through station configuration to a fully operational station. Each step saves data progressively; on re-entry the wizard auto-advances to the first incomplete step via `computeResumeStep`.

**Route guard logic (as of M12-F01):**
- `dashboard/route.tsx` `beforeLoad`: redirects to `/onboarding` if `!isAuthenticated`, if `!organization`, or if `!stations?.[0]?.isSetupComplete`.
- `onboarding/route.tsx` `beforeLoad`: redirects to `/dashboard` if `stations?.[0]?.isSetupComplete === true` (prevents already-setup users from re-entering the wizard).

`isSetupComplete` is set to `true` by `POST /stations/{stationId}/complete-setup` on Step 9 completion. The flag is persisted in the Zustand auth store (localStorage) and refreshed via `/auth/me` after the complete-setup call succeeds.

## Route Structure

```
routes/
├── __root.tsx                       # Root layout (conditional header based on route prefix)
├── index.tsx                        # Landing page (/)
├── about.tsx                        # Public page (/about)
├── auth/
│   ├── route.tsx                    # Auth layout (minimal — just <Outlet />)
│   ├── login.tsx                    # /auth/login
│   ├── register.tsx                 # /auth/register
│   ├── verify-email.tsx             # /auth/verify-email
│   ├── check-email-register.tsx     # /auth/check-email-register
│   ├── forgot-password.tsx          # /auth/forgot-password
│   ├── reset-password.tsx           # /auth/reset-password
│   ├── reset-password-success.tsx   # /auth/reset-password-success
│   └── check-email-reset.tsx        # /auth/check-email-reset
├── dashboard/
│   ├── route.tsx                    # Renders <AppShell /> (M07-F07) + auth/onboarding guard
│   ├── index.tsx                    # /dashboard (org overview)
│   ├── station.$stationId.tsx       # /dashboard/station/:stationId
│   ├── station.$stationId.setup.tsx # /dashboard/station/:stationId/setup (wizard)
│   ├── station.$stationId.shifts.tsx          # M04 stub (Owner/Manager/Custom)
│   ├── station.$stationId.nozzles.tsx         # M03 stub [M07-F10]
│   ├── station.$stationId.inventory.tsx       # M02 stub
│   ├── station.$stationId.pricing.tsx         # M06 stub [M07-F10]
│   ├── station.$stationId.credit.tsx          # M15 stub [M07-F10]
│   ├── station.$stationId.finance.tsx         # M05 stub
│   ├── station.$stationId.reports.tsx         # M07-F01..F06 stub
│   ├── station.$stationId.admin.users.tsx     # M01 stub, Owner only [M07-F10]
│   ├── station.$stationId.admin.staff.tsx     # M13 stub, Owner only, Pro+ gate [M07-F10]
│   └── station.$stationId.admin.lubricants.tsx # M09 stub, Owner only, Pro+ gate [M07-F10]
├── settings/
│   ├── route.tsx                    # Renders <AppShell /> (M07-F07), Owner+Manager guard [M07-F10]
│   └── index.tsx                    # /settings (M08 stub)
└── onboarding/
    ├── route.tsx                    # Onboarding layout (header + branding)
    └── index.tsx                    # /onboarding (first-time org/station creation)
```

## App Shell (M07-F07)

Authenticated routes render the shared `<AppShell />` (`components/layout/app-shell.tsx`)
as their route `component`, while the route's `beforeLoad` keeps the guard. The shell
provides the role-aware sidebar, top bar (station switcher, user menu, language + theme
toggles), and `<Outlet />`. Adding a module page = add the route file (with a
`requireRoles` guard from `lib/route-guards.ts`) + a `nav-config.ts` entry; it mounts
inside the shell automatically. The **active station** (selected via the top-bar
switcher, persisted in `stores/ui-store.ts`) scopes the station-level nav links;
"All Stations" (`null`) returns to `/dashboard` and hides station-scoped items.

## Layout Pattern (Composite: Nested Layouts via Outlet)

Layouts are `route.tsx` files. They wrap child routes via `<Outlet />`.

```
__root.tsx (conditional header)
  └── auth/route.tsx (minimal)
       └── auth/login.tsx (page content)
  └── dashboard/route.tsx (header + sidebar + auth guard)
       └── dashboard/index.tsx (page content)
  └── onboarding/route.tsx (header + branding badge)
       └── onboarding/index.tsx (page content)
```

**Root layout** (`__root.tsx`) detects route prefix (`isAuthRoute`, `isDashboardRoute`, `isOnboardingRoute`) to conditionally render different headers. Child layouts add their own structure.

## Auth Guard Pattern (beforeLoad)

Protected routes use `beforeLoad()` to check auth state before rendering:

```typescript
export const Route = createFileRoute("/dashboard")({
  beforeLoad: () => {
    const { isAuthenticated, organization } = useAuthStore.getState();
    if (!isAuthenticated) throw redirect({ to: "/auth/login" });
    if (!organization) throw redirect({ to: "/onboarding" });
  },
  component: DashboardLayout,
});
```

**Rules:**
- Use `useAuthStore.getState()` (not hook) — `beforeLoad` runs outside React context
- `throw redirect()` to navigate — not `navigate()` or `window.location`
- Check both `isAuthenticated` AND `organization` — users without org go to onboarding

## Page Component Pattern

Each page route exports a component via `createFileRoute()`:

```typescript
export const Route = createFileRoute("/auth/login")({
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="container ...">
      <LoginForm />
    </div>
  );
}
```

**Rules:**
- Page components handle layout (grid, padding, responsive breakpoints)
- Business logic lives in form/feature components (e.g., `<LoginForm />`)
- Data fetching via `useQuery`/`useMutation` — either in the page or child component
- Two-column layouts for auth pages: form left, visual panel right on `lg:grid-cols-2`

## Dynamic Route Params

Use `$paramName` in filename for dynamic segments:

- `station.$stationId.tsx` → `/dashboard/station/:stationId`
- `station.$stationId.setup.tsx` → `/dashboard/station/:stationId/setup`

Access params: `const { stationId } = Route.useParams()`

## Adding a New Route

1. Create file in appropriate directory (file path = URL path)
2. Export route via `createFileRoute("/path")({ component: Page })`
3. Add `beforeLoad()` if route needs auth protection
4. `routeTree.gen.ts` auto-updates on save (Vite plugin)
5. For layouts: create `route.tsx` in a folder, use `<Outlet />` for children
