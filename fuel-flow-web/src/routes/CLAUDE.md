# routes/ — TanStack Router File-Based Routing

Routes are auto-discovered from the file system by the TanStack Router Vite plugin. `routeTree.gen.ts` is auto-generated — **never edit it manually**.

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
│   ├── route.tsx                    # Dashboard layout (header + sidebar + auth guard)
│   ├── index.tsx                    # /dashboard (org overview)
│   ├── station.$stationId.tsx       # /dashboard/station/:stationId
│   └── station.$stationId.setup.tsx # /dashboard/station/:stationId/setup (wizard)
└── onboarding/
    ├── route.tsx                    # Onboarding layout (header + branding)
    └── index.tsx                    # /onboarding (first-time org/station creation)
```

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
