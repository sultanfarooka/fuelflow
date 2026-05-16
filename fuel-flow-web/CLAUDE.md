# fuel-flow-web — React Frontend

## Tech Stack

- **Framework:** React 19.2 + Vite 7.2 + TypeScript 5.9
- **Routing:** TanStack Router 1.158 (file-based, type-safe)
- **Data Fetching:** TanStack Query 5.90 (server state, caching)
- **Tables:** TanStack Table 8.21 (headless)
- **Forms:** TanStack Form 1.28 + Zod 3.25 (validation)
- **Client State:** Zustand 4.5 (persisted to localStorage)
- **UI:** shadcn/ui (New York style) + Tailwind CSS 3.4 + Radix UI
- **Icons:** Lucide React
- **Charts:** Recharts 2.15
- **HTTP:** Axios 1.13 (cookie-based auth)
- **i18n:** i18next 25.8 + react-i18next 16.5
- **Toasts:** Sonner 2.0
- **Theme:** next-themes 0.4 (light/dark/system)

## Directory Structure

```
src/
├── routes/              # TanStack Router file-based routes (SRP: one route, one file)
│   ├── __root.tsx       # Root layout with conditional header
│   ├── index.tsx        # Landing page (/)
│   ├── auth/            # Public auth routes (login, register, verify, reset)
│   ├── dashboard/       # Protected routes (org dashboard, station views, setup wizard)
│   └── onboarding/      # Post-login org/station creation
├── components/
│   ├── ui/              # shadcn/ui primitives (Button, Card, Input, etc.)
│   ├── auth/            # Auth forms (login, register, forgot/reset password)
│   ├── forms/           # Reusable form components (FormTextField)
│   └── station-setup/   # Multi-step wizard (steps 1-5: fuel types, prices, tanks, nozzles, summary)
├── lib/
│   ├── api/
│   │   ├── client.ts    # Axios instance, 401 interceptor, refresh queue
│   │   ├── auth/        # Auth endpoint functions
│   │   ├── stations/    # Station endpoint functions
│   │   ├── omcs.ts      # OMC endpoints
│   │   └── index.ts     # Barrel exports
│   ├── validators/
│   │   └── auth.ts      # Zod schemas (register, login, reset, onboarding)
│   ├── utils.ts         # cn() helper (clsx + tailwind-merge)
│   └── theme-context.ts # Theme state type
├── stores/
│   └── auth-store.ts    # Zustand with persist (user, org, stations, subscription)
├── locales/
│   ├── en.json          # English translations
│   └── ur.json          # Urdu translations
├── main.tsx             # App entry point (providers, router, query client)
├── index.css            # Tailwind imports + CSS variables (light/dark themes)
└── routeTree.gen.ts     # AUTO-GENERATED — never edit manually
```

## State Management Rules (SRP: Each Store Has One Job)

Clear boundaries — never cross these:

| What | Tool | Why |
|------|------|-----|
| **Server state** (API data) | TanStack Query (`useQuery`, `useMutation`) | Caching, refetching, staleness, deduplication |
| **Client state** (UI-only) | Zustand stores | Theme, language, sidebar open/closed |
| **Form state** | TanStack Form + Zod | Per-form lifecycle, validation, submission |

- **Never** store server data in Zustand — use TanStack Query's cache
- **Never** use `useState` for data that should survive navigation — use a store or query
- Auth store is the exception: persists user/org/stations to localStorage for route guards that run before queries

## Component Conventions

- Functional components only, always TypeScript
- Tailwind for all styling — colocated with components, no CSS modules
- shadcn/ui as base for UI elements: `import { Button } from '@/components/ui/button'`
- Add new shadcn components: `npx shadcn@latest add [component-name]`
- Components in `components/ui/` are owned code — customize freely
- Extract custom hooks when logic is reused across 2+ components (DRY)
- One component per file (SRP). Named exports preferred.

## Form Patterns (Strategy: Zod Schemas as Validation Strategies)

TanStack Form + Zod for all forms. Auth forms validate **on submit only** (not on blur).

```typescript
// Zod schema — reusable validation strategy (shared with backend FluentValidation where possible)
const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

// TanStack Form — validate on submit
const form = useForm({
  defaultValues: { email: "", password: "" } satisfies LoginFormData,
  validators: { onSubmit: loginSchema },
  onSubmit: async ({ value }) => {
    await loginMutation.mutateAsync(value as LoginRequest);
  },
});

// React Query mutation — handles async + error states
const loginMutation = useMutation<LoginApiResponse, AxiosError<{ error?: string }>, LoginRequest>({
  mutationFn: login,
  onSuccess: (data) => {
    setAuthState(data.data);
    navigate({ to: "/dashboard" });
    toast.success(`Welcome back, ${data.data.user.fullName}!`);
  },
  onError: (error) => {
    setLoginMutationError(error.response?.data?.error ?? "Login failed");
  },
});
```

**Rules:**
- Auth forms: `validators: { onSubmit: schema }` — errors show after submit, not during typing
- Other forms: may use `onBlur` or `onChange` validators as appropriate
- Always use `FormTextField` from `components/forms/` for consistent field rendering
- Server errors: display as toast + inline alert, not just one or the other

## API Client (Centralized, Single Responsibility)

`src/lib/api/client.ts` — single Axios instance with interceptors.

- **Base URL:** `VITE_API_BASE_URL` from `.env`
- **Cookies:** `withCredentials: true` — HTTP-only cookies sent automatically
- **401 Interceptor:** Refresh queue pattern — multiple 401s wait for a single refresh call, then retry. On refresh failure: `logout()` + redirect to `/auth/login`.
- **Helper methods:** `api.get<T>()`, `api.post<T>()`, `api.put<T>()`, `api.delete<T>()` — all return `response.data`
- **Feature-organized modules:** `lib/api/auth/`, `lib/api/stations/` — barrel-exported from `lib/api/index.ts`

**Error handling pattern:**
```typescript
// Consistent across all mutations (DRY)
onError: (error) => {
  toast.error(error.response?.data?.detail || "Failed to perform action");
}
```

## Data Fetching Pattern

```typescript
// Reads — useQuery with conditional fetching
const { data: omcResponse, isLoading } = useQuery({
  queryKey: ["omcs"],
  queryFn: getOMCs,
  enabled: !stations || stations.length === 0,  // Only fetch when needed
});
const omcs: OMC[] = omcResponse?.data ?? [];

// Writes — useMutation with cache invalidation
const createMutation = useMutation({
  mutationFn: createStation,
  onSuccess: () => {
    toast.success("Station created");
    queryClient.invalidateQueries({ queryKey: ["stations"] });
  },
});
```

**Query key convention:** `["resource"]` or `["resource", id, "sub-resource"]`

## Routing (File-Based, Type-Safe)

TanStack Router with automatic route tree generation. `routeTree.gen.ts` is auto-generated by the Vite plugin — **never edit it manually**.

**Protected routes via `beforeLoad()`:**
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

**Layout composition:**
- Root layout (`__root.tsx`): conditional header based on route
- Auth layout (`auth/route.tsx`): minimal, just `<Outlet />`
- Dashboard layout (`dashboard/route.tsx`): header + sidebar + `<Outlet />`
- Dynamic params: `station.$stationId.tsx` for station-specific views

## Localization

- **Languages:** English (`en.json`) + Urdu (`ur.json`) via react-i18next
- **Date format:** DD/MM/YYYY
- **Currency format:** Rs. 1,25,000 (Pakistani notation with comma grouping)
- **Usage:** `const { t } = useTranslation(); t("common.welcome")`

## Responsive Breakpoints

| Target | Width | Primary User |
|--------|-------|--------------|
| Mobile | < 640px | Nozzleman entry screens |
| Tablet | 640–1024px | Manager on tablet |
| Desktop | > 1024px | Full dashboard |

## Feature Gating (Frontend)

Check subscription plan features. Show upgrade prompt for gated features.

```typescript
const { data: subscription } = useSubscription();
const canExportReports = subscription?.plan.features.reports_export ?? false;

{canExportReports ? (
  <Button onClick={handleExport}>Export PDF</Button>
) : (
  <UpgradePrompt feature="Report Exports" />
)}
```

## Theme & Styling

- **Dark mode:** Class-based (`darkMode: 'class'`), managed by next-themes
- **CSS variables:** HSL-based theme tokens in `index.css` (primary, secondary, destructive, muted, accent, chart colors)
- **Storage key:** `fuel-flow-ui-theme`
- **Class merging:** Always use `cn()` from `lib/utils.ts` (clsx + tailwind-merge)

## Testing

- React Testing Library for component tests
- Test hooks in isolation
- Mock TanStack Query in component tests
- Test Zod validation schemas independently (unit tests)
- Test form validation with schema: `schema.safeParse(input)`

## Environment

```env
VITE_API_BASE_URL=http://localhost:5035/api/v1
VITE_ENV=development
```

## Scripts

```bash
npm run dev        # Vite dev server (http://localhost:5173)
npm run build      # TypeScript check + production build
npm run lint       # ESLint
npm run preview    # Preview production build
```

## Design Patterns in Use

| Pattern | Implementation | Principle |
|---------|---------------|-----------|
| **Strategy** | Zod schemas as swappable validation strategies | OCP: new forms = new schemas |
| **Observer** | TanStack Query subscriptions, Zustand subscriptions | Components react to state changes |
| **Singleton** | QueryClient, Axios instance, Zustand stores | Single source of truth per concern |
| **Composite** | Route layouts (`__root` -> `dashboard/route` -> page) | Nested composition of UI |
| **Facade** | `api.get/post/put/delete` wrappers | Simple interface over Axios complexity |
