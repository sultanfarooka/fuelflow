# components/ — UI Components

## Directory Structure

```
components/
├── ui/                    # shadcn 2.x primitives (radix-mira, owned code — customise freely)
│   ├── alert.tsx          # Alert / AlertTitle / AlertDescription / AlertAction
│   ├── badge.tsx          # Badge with CVA variants (default, secondary, destructive, outline) and data-icon-aware padding
│   ├── button.tsx         # Button with CVA variants (default, outline, secondary, ghost, destructive, link) and sizes (xs/sm/default/lg + icon-{xs,sm,lg})
│   ├── card.tsx           # Card / Header / Title / Description / Content / Footer
│   ├── dialog.tsx         # Dialog / DialogTrigger / DialogContent / DialogHeader / DialogTitle / DialogDescription / DialogFooter / DialogClose
│   ├── dropdown-menu.tsx  # DropdownMenu / Trigger / Content / Item / Label / Separator / Sub / Checkbox / Radio (Radix)
│   ├── field.tsx          # Field / FieldGroup / FieldLabel / FieldDescription / FieldError / FieldSet / FieldLegend / FieldSeparator — compound form-field primitives
│   ├── input.tsx          # Styled <input>
│   ├── label.tsx          # Styled <label>
│   ├── select.tsx         # Select / Trigger / Content / Item / Value / Label / Separator (Radix)
│   ├── separator.tsx      # Horizontal / vertical divider
│   ├── sheet.tsx          # Sheet / Trigger / Content (left/right/top/bottom) / Header / Title / Description / Footer / Close
│   ├── sidebar.tsx        # shadcn Sidebar block (Provider/Sidebar/Inset/Trigger/Menu…) — vendored; collapse + mobile drawer + state persistence [M07-F07]
│   ├── skeleton.tsx       # Loading skeleton (used by SidebarMenuSkeleton)
│   ├── sonner.tsx         # Toaster wrapper for Sonner; passes design tokens via style={} (sanctioned exception — see below)
│   ├── table.tsx          # Table / Header / Body / Footer / Row / Head / Cell / Caption
│   ├── tabs.tsx           # Tabs / List / Trigger / Content (Radix)
│   ├── tooltip.tsx        # Tooltip / TooltipTrigger / TooltipContent (requires TooltipProvider mounted in main.tsx)
│   └── icons/
│       └── google-icon.tsx  # OAuth-spec brand icon — sanctioned hex literals
├── layout/               # [M07-F07] App shell: app-shell.tsx (SidebarProvider + top bar + Outlet), app-sidebar.tsx (role-aware nav + active highlight), station-switcher.tsx, nav-config.ts (pure getNavItems)
├── common/               # Cross-feature components: coming-soon.tsx (stub-page placeholder)
├── auth/                  # Auth form components (TanStack Form + Zod)
│   ├── login-form.tsx
│   ├── register-form.tsx
│   ├── forgot-password-form.tsx
│   └── reset-password-form.tsx
├── forms/                 # Reusable form building blocks
│   └── form-text-field.tsx  # Generic wrapper bridging TanStack Form's FieldApi → ui/field.tsx
├── station-setup/         # Multi-step wizard
│   ├── step1-fuel-types.tsx
│   ├── step2-prices.tsx
│   ├── step3-tanks.tsx
│   ├── step4-dip-charts.tsx
│   ├── step4-nozzles.tsx
│   ├── step5-summary.tsx
│   └── price-row.tsx
├── language-switch.tsx    # Locale dropdown (English / اردو); flips <html dir> via lib/i18n.ts
├── dark-mode-toggle.tsx   # Theme switcher (light / dark / system)
├── theme-provider.tsx     # next-themes provider wrapper
└── login-form.tsx         # Legacy — prefer auth/login-form.tsx
```

## When to use a shadcn primitive vs build a custom component

**Decision flow:**

1. **Does the primitive exist in `ui/`?** → Use it. Do not reinvent buttons, cards, inputs, dropdowns, dialogs, tables, tabs, tooltips, alerts, badges, etc.
2. **Does shadcn publish it but we haven't installed it?** → `npx shadcn@latest add <name>` and use it.
3. **Is it a composition of primitives?** → Build a feature component in the appropriate subfolder (`auth/`, `station-setup/`, etc.) that *uses* primitives. Examples: `<LoginForm />` (composes Field + Input + Button + Alert), `<Step3Tanks />` (composes Card + Form + Select + Button).
4. **Is it genuinely novel UI not expressible via primitives?** → Build a one-off component co-located with the feature; still respect the theming rules below.

**Never:** rebuild a primitive (no custom Button, custom Dialog, custom Tooltip). The primitives are owned code — modify them in place if you need a new variant.

## Theming rules (NON-NEGOTIABLE)

1. **Never hard-code colours.** No hex literals, no `bg-red-500` / `text-blue-600` / `border-orange-400` style raw Tailwind colour palettes. Use semantic design tokens.
2. **Available semantic tokens** (defined in `src/index.css`):
   - Layout: `background`, `foreground`, `card` (+ `card-foreground`), `popover` (+ `-foreground`), `muted` (+ `-foreground`), `accent` (+ `-foreground`)
   - State: `primary` (+ `-foreground`), `secondary` (+ `-foreground`), `destructive`, `success` (+ added in M07-F09 for success-state UI)
   - Form / focus: `border`, `input`, `ring`
   - Sidebar (M07-F07 ready): `sidebar`, `sidebar-foreground`, `sidebar-primary` (+ `-foreground`), `sidebar-accent` (+ `-foreground`), `sidebar-border`, `sidebar-ring`
   - Charts: `chart-1` … `chart-5`
3. **Usage syntax (Tailwind 4 + radix-mira preset):**
   - Background: `bg-success`, `bg-destructive`, `bg-primary/10`, `bg-card`
   - Text: `text-foreground`, `text-success`, `text-muted-foreground`
   - Border: `border-border`, `border-destructive/40`
   - Opacity: token name + `/N` (where N is the opacity %): `bg-success/10`, `ring-ring/30`
4. **Class merging:** always use `cn()` from `@/lib/utils` — handles tailwind-merge conflict resolution.
5. **CVA for variants:** primitives use `class-variance-authority` to declare variants (e.g. `<Button variant="ghost">`). When adding a variant, extend the existing `cva()` block — don't fork.
6. **`data-slot` and `data-variant`:** every shadcn 2.x primitive sets `data-slot="..."` and (where relevant) `data-variant="..."` / `data-size="..."`. Use these for downstream styling hooks (e.g. `data-[variant=destructive]:bg-destructive/20`) rather than wrapping primitives in extra divs.

## RTL rules (NON-NEGOTIABLE)

The app supports Urdu (`<html dir="rtl">`) end-to-end. Layout must mirror automatically.

1. **Always use logical Tailwind utilities, never physical ones:**

| Physical (DO NOT USE) | Logical (USE THIS) |
|---|---|
| `ml-2` (margin-left) | `ms-2` (margin-inline-start) |
| `mr-2` (margin-right) | `me-2` (margin-inline-end) |
| `pl-3` | `ps-3` |
| `pr-3` | `pe-3` |
| `left-0`, `left-1/2` | `start-0`, `start-1/2` |
| `right-0`, `right-4` | `end-0`, `end-4` |
| `text-left` | `text-start` |
| `text-right` | `text-end` |
| `border-l-2` | `border-s-2` |
| `border-r-2` | `border-e-2` |
| `rounded-l-md` | `rounded-s-md` |
| `rounded-r-md` | `rounded-e-md` |

2. **`<html dir>` is the single source of truth.** Driven by `i18n.language` in [`src/lib/i18n.ts`](../lib/i18n.ts). Do not call `document.documentElement.dir = ...` directly anywhere else.
3. **`rtl:` variant is acceptable as a last resort.** When a logical utility doesn't exist for a property (e.g. `translate-x-1/2 rtl:translate-x-1/2` for centering), use it sparingly — preferable to physical utilities with no override. Document why in a comment.
4. **Icon position via `data-[icon=inline-start]` / `data-[icon=inline-end]`** (shadcn 2.x convention) flips automatically since the data attribute names refer to *logical* positions.

## Dark-mode test checklist

Before opening a PR that adds or changes a screen, manually verify in **both** light and dark mode:

- [ ] Every surface (background, card, popover, sidebar) is visible and readable.
- [ ] Text contrast meets WCAG AA against its background.
- [ ] Borders are visible (not invisible against background or foreground).
- [ ] Focus rings show clearly on inputs, buttons, links.
- [ ] Overlays (Dialog, Sheet, Tooltip, DropdownMenu) have correct popover background + foreground.
- [ ] Icons inherit `currentColor` or use a token; no hardcoded white/black SVG strokes.
- [ ] Hover states are distinct from idle.
- [ ] Destructive states (alerts, delete buttons) read as warning, not as a neutral state.

If the screen looks subtly wrong in dark mode, **don't ship**. Either fix the token usage or escalate. Dark mode is not optional.

## Going-forward additions

**Adding a new shadcn primitive:** `npx shadcn@latest add [name]` lands in `ui/` in radix-mira style. The CLI will ask before overwriting existing primitives — **decline** unless deliberately refreshing.

**Adding a feature component:** create in the appropriate subfolder (`auth/`, `station-setup/`, or a new folder for a new feature). One component per file, named export, TypeScript, Tailwind utilities only (no CSS modules, no styled-components).

**Adding a new design token:** add the oklch value to both `:root` and `.dark` blocks in `src/index.css`, then add the `--color-<name>: var(--<name>);` mapping inside the `@theme inline { … }` block so it's usable as `bg-<name>` / `text-<name>` / etc. Then document the token here (Theming rules §2).

## Sanctioned exceptions

These are the **only** places the audit grep allows non-token colour / `style={}` use:

| Location | Exception | Why |
|---|---|---|
| `ui/icons/google-icon.tsx` | 4 hex literals (`#4285F4`, `#34A853`, `#FBBC05`, `#EA4335`) | Google's brand guidelines mandate exact hex values for OAuth buttons. Replacing with tokens would violate brand spec. |
| `ui/sonner.tsx` | `style={{ "--normal-bg": "var(--popover)", ... }}` | shadcn-canonical Sonner integration. The `style` prop passes design *tokens* into Sonner's CSS-variable theming API — not raw colours. |
| `ui/sidebar.tsx` | physical `left/right` utilities keyed to `data-[side=left|right]` (e.g. `data-[side=left]:left-0`, `transition-[left,right,width]`) | Vendored shadcn Sidebar block (preset `b3lVLqquH`). Its desktop fixed-positioning is keyed to its own dual-side coordinate system and ships with `rtl:` overrides for transforms + logical utilities (`start`/`end`, `ms-`) elsewhere. We anchor a single sidebar at inline-start (`side="left"`, the default) and do not hand-rewrite the primitive. All *our* shell components (`layout/*`) use logical utilities. |
| `assets/react.svg` | hex inside SVG | React's brand asset. Untouched. |

Any new exception requires: (a) a comment in the file justifying it, (b) an entry added to this table, (c) reviewer sign-off.

## Compound primitive examples

**Field system** — the form-field building blocks live in `ui/field.tsx`:

- `<FieldGroup>` — container with vertical spacing for stacked fields
- `<FieldSet>` / `<FieldLegend>` — semantic fieldset for grouped inputs
- `<Field data-invalid={hasError}>` — wrapper with orientation variants
- `<FieldLabel htmlFor={id}>` — styled label
- `<FieldDescription>` — help text below the input
- `<FieldError errors={…}>` — displays first error; accepts `Array<{ message?: string }>` from TanStack Form
- `<FieldSeparator>` — divider with optional label

The TanStack-Form-native wrapper that ties FieldApi to the Field system lives at `forms/form-text-field.tsx` — **always use it** for text inputs in forms:

```tsx
<form.Field name="email" children={(field) => (
  <FormTextField
    field={field}
    label="Email"
    type="email"
    autoComplete="email"
    description="We'll send a verification link"
  />
)} />
```

## Form story

This project uses **TanStack Form + Zod** for all forms. The shadcn `Form` primitive (which wraps `react-hook-form`) is **intentionally not installed** to avoid two conflicting forms libraries.

**Standard auth form structure (followed in `auth/*-form.tsx`):**

```tsx
const form = useForm({
  defaultValues: { /* … */ },
  validators: { onSubmit: someZodSchema },   // Validate on submit only
  onSubmit: async ({ value }) => { await mutation.mutateAsync(value); },
});

const mutation = useMutation({
  mutationFn: someApiCall,
  onSuccess: (data) => { /* setAuthState, navigate, toast.success */ },
  onError: (error) => { /* setError + toast.error — never just one */ },
});
```

**Rules:**
- Auth forms: `validators: { onSubmit: schema }` — errors show after submit, not during typing.
- Other forms: `onBlur` / `onChange` validators are fine.
- Server errors: display as toast **and** inline `<Alert variant="destructive">` (toasts disappear; alerts persist).
- Always use `FormTextField` from `forms/` for text inputs — don't build custom wrappers.

## Dialog / Sheet patterns

- **Confirmations for destructive actions** (delete tank, deactivate station, downgrade plan): always use `Dialog`. **Never** `window.confirm()` — it bypasses theme and i18n.
- **Forms in modals:** prefer a dedicated route over a Dialog for multi-field forms; reserve Dialog for ≤3 fields or single-click confirmations.
- **Sheet** is for side-anchored content (filters, settings, drawer-style navigation). Use `side="start"`/`"end"`/`"top"`/`"bottom"`. (Note: legacy `side="left"`/`"right"` still works but resolves to physical sides; prefer logical.)
- **Dismissibility:** `onOpenChange` to a no-op if confirmation is required (data-loss risk).

## Toast usage (Sonner)

Sonner is mounted once in `main.tsx` and themed via `ui/sonner.tsx`'s design-token integration. Import and call `toast` directly:

| Outcome | Call | When |
|---|---|---|
| Success | `toast.success("Tank created")` | After successful mutation (also invalidate queries) |
| Error | `toast.error(message)` | On mutation error; fall back to `"Failed to perform action"` if no server message |
| Info | `toast.info(message)` | Non-blocking nudges ("Trial expires in 3 days") |
| Promise | `toast.promise(mutation.mutateAsync(…), { loading, success, error })` | Long-running ops with progress |

**Always pair toasts with inline `<Alert variant="destructive">`** for form-level server errors. Toasts vanish; alerts persist for screen readers.

## Recharts theme

Charts must use the token CSS variables so dark mode works automatically:

```tsx
<LineChart data={data}>
  <CartesianGrid stroke="var(--border)" />
  <XAxis stroke="var(--muted-foreground)" />
  <YAxis stroke="var(--muted-foreground)" />
  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)" }} />
  <Line stroke="var(--chart-1)" strokeWidth={2} />
</LineChart>
```

Chart colours `--chart-1` … `--chart-5` are defined in `index.css` for both themes. **Never hardcode hex values** in chart props.

## App shell & navigation (M07-F07)

The authenticated layout lives in `components/layout/`. Every authenticated route
tree (`dashboard/route.tsx`, `settings/route.tsx`) renders `<AppShell />` as its
`component`; the route's `beforeLoad` keeps the auth/onboarding/role guard.

| Piece | Responsibility |
|---|---|
| `app-shell.tsx` | `SidebarProvider` + `<AppSidebar />` + top bar (`SidebarTrigger`, `StationSwitcher`, `LanguageSwitch`, `ModeToggle`, user menu) + `SidebarInset` with the dev-bypass banner slot and `<Outlet />`. Syncs the active station from the route `stationId` param. |
| `app-sidebar.tsx` | Renders `getNavItems(...)` through the Sidebar primitive; active-route highlighting via `useRouterState().location.pathname`. Presentation only. |
| `nav-config.ts` | **Pure** `getNavItems(roles, activeStationId)` — the single source of nav visibility. Role + scope filtering, no React. Unit-test this for role rules. |
| `station-switcher.tsx` | Lists stations + "All Stations"; sets `activeStationId` (ui-store) and navigates. |

**Rules:**
- Add a nav link by editing `NAV_CATALOGUE` in `nav-config.ts` (icon, `labelKey`,
  `to`, `roles`, `scope`) — never hard-code links in `app-sidebar.tsx`.
- Role gating is UX only; the matching route still needs its own `beforeLoad`
  role guard (`requireRoles` in `lib/route-guards.ts`) and the API enforces access.
- Active station is **client UI state** in `stores/ui-store.ts` (not the auth
  store, not a query). `null` = "All Stations" → station-scoped nav hidden.
- New module pages mount inside the shell automatically — just add the route
  file and its `nav-config` entry; replace the `<ComingSoon />` stub with content.
- Icons: prefer Tabler (`@tabler/icons-react`, preset default) for new shell code.

## Subscription UI components (planned)

Needed for [M11-F02](../../../docs/MODULES.md#m11-f02--trial-period), [M11-F06](../../../docs/MODULES.md#m11-f06--feature-gating), [M11-F08](../../../docs/MODULES.md#m11-f08--plan-comparison--pricing-page):

| Component | Location | Purpose |
|---|---|---|
| `<TrialBanner />` | `subscription/trial-banner.tsx` | Top of dashboard layout while subscription is trial; days remaining + Upgrade CTA |
| `<UpgradePrompt />` | `subscription/upgrade-prompt.tsx` | Inline lock-icon + message for gated features; links to `/settings/subscription` |
| `<PlanCard />` | `subscription/plan-card.tsx` | Single plan tile for `/pricing` (M11-F08); variants Starter / Professional / Enterprise |
| `<BillingToggle />` | `subscription/billing-toggle.tsx` | Monthly / Yearly switch on `/pricing` |

These don't exist yet — add when implementing M11-F08 / M11-F02 UI.

## Compliant vs non-compliant examples

### Token usage

```tsx
// ❌ NON-COMPLIANT — raw Tailwind colour
<Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
  Most popular
</Badge>

// ✅ COMPLIANT — semantic token, dark mode handled by --success oklch pair
<Badge className="bg-success/10 text-success">
  Most popular
</Badge>
```

### RTL utilities

```tsx
// ❌ NON-COMPLIANT — physical, won't mirror in Urdu
<LogOut className="mr-2 h-4 w-4" />
<div className="ml-4 pl-3 border-l-2">…</div>

// ✅ COMPLIANT — logical, mirrors automatically
<LogOut className="me-2 h-4 w-4" />
<div className="ms-4 ps-3 border-s-2">…</div>
```

### Confirmation prompts

```tsx
// ❌ NON-COMPLIANT — bypasses theme, ignores i18n, breaks on mobile
if (window.confirm("Delete this tank?")) {
  deleteTank();
}

// ✅ COMPLIANT — Dialog primitive with translated copy
<Dialog>
  <DialogTrigger asChild>
    <Button variant="destructive">Delete tank</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogTitle>{t("station.deleteTank.title")}</DialogTitle>
    <DialogDescription>{t("station.deleteTank.body")}</DialogDescription>
    <DialogFooter>
      <DialogClose asChild><Button variant="ghost">{t("common.cancel")}</Button></DialogClose>
      <Button variant="destructive" onClick={deleteTank}>{t("common.delete")}</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Form fields

```tsx
// ❌ NON-COMPLIANT — custom wrapper, no a11y, no error rendering
<form.Field name="email" children={(field) => (
  <div>
    <label>Email</label>
    <input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
    {field.state.meta.errors[0] && <p style={{ color: "red" }}>{field.state.meta.errors[0]}</p>}
  </div>
)} />

// ✅ COMPLIANT — FormTextField handles label, errors, ARIA, touched/invalid
<form.Field name="email" children={(field) => (
  <FormTextField field={field} label="Email" type="email" autoComplete="email" />
)} />
```

## Audit grep (CI-ready)

To verify a screen passes design-system compliance, run these greps in `fuel-flow-web/src/`:

```bash
# Should be empty (except the sanctioned Sonner exception in ui/sonner.tsx):
rg 'style=\{'

# Should be empty (except google-icon.tsx and assets/):
rg '#[0-9a-fA-F]{3,6}\b' --type tsx --type ts --type css

# Should always be empty:
rg '\b(bg|text|border|ring|fill|stroke|from|to|via)-(red|blue|green|orange|amber|yellow|purple|pink|teal|cyan|indigo|sky|emerald|lime|rose|fuchsia|violet|slate|zinc|neutral|stone|gray)-'

# Should always be empty (physical-direction utilities):
rg '\b(ml|mr|pl|pr)-\d|\bleft-\d|\bright-\d|\btext-(left|right)\b|\bborder-(l|r)-|\brounded-(l|r)-'

# Should always be empty outside src/components/ui/ (the primitives wrap
# these internally; everywhere else must go through the shadcn primitive):
rg '<select\b|<textarea\b' -g '!src/components/ui/**'
```

A new PR that introduces any of these without a documented sanctioned-exception entry should be sent back.
