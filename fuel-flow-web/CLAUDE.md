# fuel-flow-web — React Frontend

## Tech Stack

- **Framework:** React 19.2 + Vite 7.2 + TypeScript 5.9
- **Routing:** TanStack Router 1.158 (file-based, type-safe)
- **Data Fetching:** TanStack Query 5.90 (server state, caching)
- **Tables:** TanStack Table 8.21 (headless)
- **Forms:** TanStack Form 1.28 + Zod 3.25 (validation)
- **Client State:** Zustand 4.5 (persisted to localStorage)
- **UI:** shadcn/ui 2.x (radix-mira style, `b3lVLqquH` preset) + Tailwind CSS 4.3 + Radix UI (umbrella `radix-ui` package)
- **Icons:** Tabler Icons (preset default) — Lucide React kept for pre-existing imports
- **Charts:** Recharts 2.15
- **HTTP:** Axios 1.13 (cookie-based auth)
- **i18n:** i18next 25.8 + react-i18next 16.5 (initialised in `src/lib/i18n.ts`; en + ur; `<html dir>` flips automatically on language change)
- **Toasts:** Sonner 2.0
- **Theme:** next-themes 0.4 (light/dark/system; storage key `fuel-flow-ui-theme`)
- **Fonts:** Inter Variable (`@fontsource-variable/inter`) — preset-provided

### Why these choices?

- **TanStack Router** over React Router — type-safe params, file-based routing, better DevTools
- **TanStack Query** over Redux Toolkit Query — purpose-built for server state, automatic caching/refetching
- **TanStack Form** over React Hook Form — same ecosystem as Router/Query, framework-agnostic, first-class Zod adapter (shadcn's `Form` primitive intentionally **not** installed — see [`src/components/CLAUDE.md`](src/components/CLAUDE.md))
- **Zustand** over Redux — small API, no boilerplate, persistence middleware; suits client-only UI state
- **shadcn/ui** over MUI / Ant — unstyled components we own (no upstream lock-in), customisable for Pakistani-aesthetic and dark-mode tokens
- **Tailwind 4** with CSS-first config (`@theme` in `index.css`, no `tailwind.config.js`) for the preset compatibility, oklch colour pipeline, and faster compile via `@tailwindcss/vite` plugin
- **Zod** over Joi / Yup — schemas inferable to TS types, shareable with backend FluentValidation semantics
- **Vite** over CRA — faster cold starts, native ESM, simpler PWA plugin
- **i18next** — RTL-friendly, Urdu pluralisation rules, namespacing for large translation sets

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
│   ├── i18n.ts          # i18next init (en+ur, dir flip wired here)
│   ├── utils.ts         # cn() helper (clsx + tailwind-merge)
│   └── theme-context.ts # Theme state type
├── stores/
│   └── auth-store.ts    # Zustand with persist (user, org, stations, subscription)
├── locales/
│   ├── en.json          # English translations
│   └── ur.json          # Urdu translations
├── main.tsx             # App entry point (providers, router, query client)
├── index.css            # Tailwind 4 @import + @theme + design tokens (oklch, light/dark)
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

- **Languages:** English (`en.json`) + Urdu (`ur.json`) via react-i18next, initialised in [`src/lib/i18n.ts`](src/lib/i18n.ts)
- **Date format:** DD/MM/YYYY
- **Currency format:** Rs. 1,25,000 (Pakistani notation with comma grouping)
- **Usage:** `const { t } = useTranslation(); t("common.welcome")`
- **Language switcher:** `<LanguageSwitch />` component mounted in every layout header
- **RTL:** Urdu sets `<html dir="rtl" lang="ur">` automatically on `languageChanged` (handled in `i18n.ts`). All layout utilities must be logical (see Theme & Styling)
- **Content sweep status:** the i18n runtime is wired (this is M07-F09-R04); the call-site sweep that retro-wires `useTranslation` across shipped screens is tracked separately under [M08-F05-R05](../docs/MODULES.md#m08-f05--system-preferences). Today's shipped screens render English text and rely on layout RTL only.

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

## Subscription Status UI

Three places the subscription state is surfaced to the user — drives [M11-F02](../docs/MODULES.md#m11-f02--trial-period), [M11-F04](../docs/MODULES.md#m11-f04--expiry--grace-period), [M11-F06](../docs/MODULES.md#m11-f06--feature-gating):

| Element | Location | Behaviour |
|---|---|---|
| **Trial banner** | Top of dashboard layout (in `dashboard/route.tsx` shell) | Shown for trial subs only; "X days left in trial — Upgrade now". Persistent until trial ends or user upgrades. |
| **Upgrade prompts** | Inline next to gated features (Reports Export, Lubricants, SMS) | `<UpgradePrompt feature="…" />` component renders a lock icon + "Upgrade to unlock" → links to `/settings/subscription`. |
| **Subscription page** | `/settings/subscription` (Owner-only route) | Current plan, usage vs limits (stations / users / modules), payment history, "Upgrade" CTA → links to `/pricing` ([M11-F08](../docs/MODULES.md#m11-f08--plan-comparison--pricing-page)). |

Trial banner reads from the auth store's `subscription.status === 'trial'` and `subscription.trialEndsAt`. Don't duplicate the days-remaining calculation across components — derive it once in a shared `useTrialDaysRemaining` hook.

## PWA Features

Configured via `vite-plugin-pwa`. See [M07-F08](../docs/MODULES.md#m07-f08--progressive-web-app-pwa) for the spec.

| Feature | Status | Notes |
|---|---|---|
| Offline app shell | Planned | Service worker pre-caches routes + assets; failed API calls show a retry banner (no offline queue). |
| Add to Home Screen | Planned | Web app manifest with icons (192/512) + name + theme color. Triggers install prompt on supported browsers. |
| Push notifications | Out of Scope (v2) | Web Push API for stock/price/shortage alerts later — falls back to in-app + SMS in v1. |

When making any change touching the service worker or manifest, bump the build to invalidate the SW cache for already-installed users.

## Theme & Styling

- **Dark mode:** Class-based via Tailwind 4's `@custom-variant dark (&:is(.dark *))` in `index.css`; managed by next-themes
- **Design tokens:** oklch values in `:root` / `.dark` (preset b3lVLqquH radix-mira palette). Mapped to Tailwind colours via `@theme inline { --color-* : var(--*); }`
- **Semantic tokens:** `--primary`, `--secondary`, `--destructive`, `--success`, `--muted`, `--accent`, `--popover`, `--card`, `--border`, `--input`, `--ring`, `--chart-1..5`, `--sidebar*`
- **Storage key:** `fuel-flow-ui-theme` (theme); `fuel-flow-language` (locale)
- **Class merging:** Always use `cn()` from `lib/utils.ts` (clsx + tailwind-merge)
- **RTL:** `components.json` has `"rtl": true`. Use Tailwind logical utilities (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`, `text-start`, `text-end`, `border-s`, `border-e`, `rounded-s-*`, `rounded-e-*`) — **never** physical (`ml-`, `mr-`, etc.). `<html dir>` flips automatically when language changes via `src/lib/i18n.ts`.

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
