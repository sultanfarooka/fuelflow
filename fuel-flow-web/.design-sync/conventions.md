# Flow Design System — how to build with it

The component library for **Fuel Flow**, a filling-station management app (React 19 + Tailwind CSS 4 + Radix, shadcn `radix-mira` style). Components are real shadcn primitives — import them and compose; do **not** rewrite them. The brand color is an orange-red (`--primary`).

## Setup & wrapping
- Styling ships in `styles.css` (compiled Tailwind utilities + the oklch design tokens + the Inter Variable font). It must be loaded; components carry **no** inline styles of their own.
- **Light/dark:** tokens live in `:root` (light) and under a `.dark` ancestor (dark). Put `class="dark"` on a wrapping element for dark mode — every token flips automatically. Don't hardcode light/dark colors.
- **Providers:** wrap `Tooltip` usage in `<TooltipProvider>`, and `Sidebar` usage in `<SidebarProvider>`. Mount `<Toaster />` once near the app root, then call `toast()` (from `sonner`) to show messages.

## Styling idiom — semantic tokens, never raw colors
Style with Tailwind utilities bound to **semantic token names** — never raw palette colors (`bg-red-500`) or hex. Token families (all have light/dark values):

| Purpose | Utilities |
|---|---|
| Page / text | `bg-background` `text-foreground` |
| Surfaces | `bg-card` `text-card-foreground` · `bg-popover` `text-popover-foreground` |
| Brand action | `bg-primary` `text-primary-foreground` |
| Muted / subtle | `bg-muted` `text-muted-foreground` · `bg-accent` `text-accent-foreground` |
| Secondary | `bg-secondary` `text-secondary-foreground` |
| Danger | `bg-destructive` `text-destructive` |
| Success | `bg-success` |
| Lines / focus | `border-border` `ring-ring` `bg-input` |
| Sidebar | `bg-sidebar` `text-sidebar-foreground` `bg-sidebar-primary` `bg-sidebar-accent` |
| Charts | `text-chart-1` … `text-chart-5` |

Opacity with `/N` (e.g. `bg-primary/10`, `border-destructive/40`). Radii via `rounded-md`/`-lg`/`-xl` (scaled from `--radius`). Font is Inter Variable (`font-sans`).

**Variants are props, not classes.** `Button` and `Badge` take `variant` (`default` | `secondary` | `outline` | `ghost` | `destructive` | `link`); `Button` also takes `size` (`xs` | `sm` | `default` | `lg` | `icon` / `icon-xs` / `icon-sm` / `icon-lg`). The compact `default` size suits data-dense UIs; use `size="lg"` for full-page auth/onboarding forms. Merge extra classes with `cn()`.

**RTL (the app supports Urdu):** use logical utilities — `ms-`/`me-`, `ps-`/`pe-`, `start-`/`end-`, `text-start`/`text-end`, `border-s`/`border-e`, `rounded-s`/`rounded-e` — never physical (`ml-`, `pl-`, `left-`, `text-left`).

## Where the truth lives
- The bound `styles.css` and its `@import` closure = the authoritative tokens + utilities.
- Each component has a `<Name>.prompt.md` (usage) and `<Name>.d.ts` (props) — read these before composing.
- Forms use **TanStack Form + Zod**; wrap inputs with `FormTextField` / `FormSelectField` rather than raw `Input`/`Select`. Confirmations use `Dialog` (never `window.confirm`).

## Idiomatic example
```tsx
<Card>
  <CardHeader>
    <CardTitle>Karachi - North</CardTitle>
    <CardDescription>PSO · 3 nozzles · 2 tanks</CardDescription>
    <CardAction><Badge>Open</Badge></CardAction>
  </CardHeader>
  <CardContent className="grid grid-cols-2 gap-3 text-sm">
    <div><div className="text-muted-foreground">Today's sales</div><div className="font-medium">Rs. 1,25,000</div></div>
    <div><div className="text-muted-foreground">Litres sold</div><div className="font-medium">472 L</div></div>
  </CardContent>
  <CardFooter className="justify-end gap-2">
    <Button variant="ghost">Details</Button>
    <Button>Open shift</Button>
  </CardFooter>
</Card>
```
