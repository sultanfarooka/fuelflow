# components/ — UI Components

## Directory Structure

```
components/
├── ui/                    # shadcn/ui primitives (owned code — customize freely)
│   ├── button.tsx         # CVA variants: default, destructive, outline, secondary, ghost, link
│   ├── input.tsx          # forwardRef input with Tailwind defaults
│   ├── card.tsx           # Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
│   ├── alert.tsx          # Alert with variant CVA (default, destructive)
│   ├── field.tsx          # Field system: Field, FieldGroup, FieldLabel, FieldDescription, FieldError
│   ├── badge.tsx          # Badge component
│   ├── label.tsx          # Form label
│   ├── select.tsx         # Select dropdown
│   ├── separator.tsx      # Visual separator
│   ├── dropdown-menu.tsx  # Dropdown menu (Radix)
│   ├── sonner.tsx         # Toast configuration
│   └── icons/
│       └── google-icon.tsx
├── auth/                  # Auth form components
│   ├── login-form.tsx     # Login with TanStack Form + mutation
│   ├── register-form.tsx  # Multi-step registration
│   ├── forgot-password-form.tsx
│   └── reset-password-form.tsx
├── forms/                 # Reusable form building blocks
│   └── form-text-field.tsx # Generic field wrapper for TanStack Form
├── station-setup/         # Multi-step wizard components
│   ├── step1-fuel-types.tsx   # Add/delete fuel types
│   ├── step2-prices.tsx       # Set prices per fuel type
│   ├── step3-tanks.tsx        # Configure tanks
│   ├── step4-nozzles.tsx      # Configure nozzles
│   ├── step5-summary.tsx      # Review & submit
│   └── price-row.tsx          # Inline price editor (saved/editing states)
├── dark-mode-toggle.tsx   # Theme switcher button
├── theme-provider.tsx     # Theme context provider (next-themes)
└── login-form.tsx         # Legacy (prefer auth/login-form.tsx)
```

## shadcn/ui Conventions (`ui/`)

These are **owned code** — imported from shadcn but fully customizable.

**Pattern:**
```typescript
const buttonVariants = cva("inline-flex items-center ...", {
  variants: {
    variant: { default: "...", destructive: "...", outline: "..." },
    size: { default: "h-10 px-4", sm: "h-9 px-3", lg: "h-11 px-8", icon: "h-10 w-10" },
  },
  defaultVariants: { variant: "default", size: "default" },
});

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => (
  <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
));
```

**Rules:**
- Always use ShadCN Components whenever available
- Always use `React.forwardRef` for ref forwarding
- Always use `cn()` from `@/lib/utils` for className merging (handles Tailwind conflicts)
- Use `cva()` (class-variance-authority) for component variants
- Use `data-slot` attributes for semantic identification (`data-slot="field"`, `data-slot="description"`)
- Add new shadcn components: `npx shadcn@latest add [component-name]`

## Field System (`ui/field.tsx`)

Compound component pattern for form fields:

- `FieldGroup` — container with `space-y-4`
- `FieldSet` / `FieldLegend` — semantic fieldset
- `Field` — wrapper with orientation variants (default vertical, horizontal, responsive)
- `FieldLabel` — styled label
- `FieldDescription` — help text below field
- `FieldError` — displays first error message with `data-slot="field-error"`
- `FieldSeparator` — divider with optional label

## FormTextField (`forms/form-text-field.tsx`)

Reusable wrapper that connects TanStack Form's `FieldApi` to the Field system:

```typescript
<FormTextField
  field={field}          // TanStack Form FieldApi
  label="Email"
  type="email"
  placeholder="Enter email"
  description="We'll send a verification link"
/>
```

**Handles:** label rendering, error display, aria attributes, touched/invalid states.
**Always use this** for text inputs in forms — don't build custom field wrappers.

## Auth Form Pattern (`auth/`)

Each auth form follows the same structure:

1. **TanStack Form** with Zod validator on `onSubmit`
2. **React Query mutation** for the API call
3. **Error state** — server errors displayed as `<Alert variant="destructive">`
4. **Success** — `toast.success()` + navigation
5. **Loading** — `mutation.isPending` disables submit button

```typescript
// Standard auth form structure
const form = useForm({
  defaultValues: { email: "", password: "" },
  validators: { onSubmit: loginSchema },      // Zod — validate on submit only
  onSubmit: async ({ value }) => {
    await mutation.mutateAsync(value);
  },
});

const mutation = useMutation({
  mutationFn: login,
  onSuccess: (data) => { setAuthState(data.data); navigate({ to: "/dashboard" }); },
  onError: (error) => { setError(error.response?.data?.error ?? "Failed"); },
});
```

## Station Setup Wizard (`station-setup/`)

Multi-step wizard for initial station configuration. Each step is a standalone component.

**Props pattern:** Every step receives:
- `stationId: string` — current station being configured
- `onNext: () => void` — advance to next step
- `onBack: () => void` — go to previous step

**Step conventions:**
- Each step owns its own `useQuery` and `useMutation` calls (SRP)
- Validation in footer: `<Alert>` for errors, disabled Next button until valid
- `queryClient.invalidateQueries()` after mutations to refresh data
- Toast notifications for success/error feedback
- `price-row.tsx` manages inline edit state (saved vs editing) per row

## Adding a New Component

**shadcn primitive:** `npx shadcn@latest add [name]` → lands in `ui/`
**Feature component:** Create in appropriate subfolder (`auth/`, `station-setup/`, or new folder)
**Reusable form element:** Add to `forms/`

**Rules:**
- One component per file (SRP)
- Named exports preferred over default exports
- TypeScript for all components — explicit prop types
- Tailwind for all styling — no CSS modules or styled-components
- Use `cn()` for conditional classes
- Use shadcn components as base — don't reinvent Button, Card, Input, etc.
