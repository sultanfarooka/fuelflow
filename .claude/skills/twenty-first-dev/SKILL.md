---
name: twenty-first-dev
description: Component-pattern guidance distilled from 21st.dev's marketplace of shadcn/Tailwind components. Use when composing dense, professional UI from primitives — landing heroes, auth forms, dashboards, pricing, settings. Emphasises real-app polish over default shadcn aesthetics.
---

# 21st.dev Component Patterns

21st.dev curates production-grade UI components built on shadcn/ui + Tailwind. This skill captures the **compositional and aesthetic patterns** that distinguish their components from default-shadcn output, so designs feel intentional rather than templated.

This is reference material — the agent reads it when composing or auditing a screen.

## Core principles

1. **Density before whitespace.** Default shadcn components are too airy. Tighten vertical rhythm (use `gap-2`/`gap-3` between related fields, `gap-6`/`gap-8` between sections). Reduce input height to `h-9`–`h-10` on dense forms, `h-11`–`h-12` on hero/marketing forms only.

2. **Borders + subtle backgrounds, not shadows.** Card chrome should rely on `border` + `bg-card`/`bg-muted/40` layering. Drop shadows are for floating elements (popovers, dropdowns, command palettes) — not static cards.

3. **Two-tone palettes win.** Pick a primary (often desaturated brand color) and one accent (warm or cool). Everything else is neutral. Avoid the multi-color rainbow look.

4. **Inline labels over floating-label gimmicks.** Top-aligned labels with `text-sm font-medium` and `text-muted-foreground` helper text below. Floating labels read as "designed by AI."

5. **Active states matter.** Tab pills, segmented controls, nav items — they should have a clear active state (filled background, not just bolder text). Use `bg-muted` + `text-foreground` for active, plain `text-muted-foreground` for inactive.

6. **Use `bg-muted/N0` for layered surfaces.** Subtle 5–20% mix of muted on background gives depth without committing to a card shadow.

## Composition patterns

### Auth screens (login / register / OTP / password-reset)

- **Mode:** centered single-column or split (form left, brand canvas right).
- **Container:** no card chrome on the form column — let the background do the work. Optionally a hairline border on the form's outer wrapper at desktop only.
- **Header:** small uppercase eyebrow ("Sign up" or "Step 1 of 2"), large `text-2xl`/`text-3xl` heading, short subhead in `text-muted-foreground`.
- **Form fields:** standard bordered inputs OR underline-only (`border-0 border-b`). Pick one and commit. Never mix.
- **Primary CTA:** full-width, `h-11`–`h-12`, no icon by default. Icon only if it indicates a destination ("Continue →") or a state ("Verifying…").
- **Secondary actions:** plain text links in `text-sm text-muted-foreground` with `underline-offset-4 hover:underline`.
- **Inline alerts (4xx errors):** left-border accent (`border-s-4 border-destructive`) + tinted background (`bg-destructive/5`) + clear recovery action buttons. Stack icon+title on row 1, body paragraph on row 2, actions on row 3.

### Brand canvas / split panel

- Full-bleed color block, **not** a tinted box. Use the primary color saturated, not as a 5% tint.
- Display heading at 36–48px, line-height ~1.05, weight 600.
- Body copy at `text-base text-primary-foreground/85` (slight opacity for hierarchy).
- One subtle texture: a single `bg-[radial-gradient(...)]` highlight or a `noise` SVG overlay at 5% opacity. Not both.
- A footer chip with one sentence of social proof or a privacy note. Keep it small (`text-xs`).

### Data-dense surfaces (dashboards, tables)

- Sticky filter bar (top), table below, optional pagination at the bottom. No spacing above the table — flush against the filter bar.
- Row hover: `hover:bg-muted/50`. Click target: whole row (use `<tr>` with `cursor-pointer` + sr-only link if linked).
- Empty states: centered icon (size-10 muted) + heading + one-sentence subhead + primary action. Don't decorate.

### Hero / landing

- Lead with one specific concrete claim, not a marketing platitude. Big bold display type. Resist a stock illustration; if you need imagery, use a product screenshot or a real-data visualization.
- Sub-heading explains who it's for and what it does, max ~80 characters.
- Primary + ghost CTA pair. Single primary action — don't show two filled buttons.

## Tokens & sizing cheat sheet

| Use | Class |
|---|---|
| Field height (dense form) | `h-9` |
| Field height (auth/hero) | `h-11` or `h-12` |
| Primary button height | `h-11` (auth) / `h-9` (dense) |
| Heading size (display hero) | `text-4xl` / `text-5xl` / inline `style={{ fontSize: 44 }}` |
| Heading size (page) | `text-2xl` or `text-3xl` |
| Section heading | `text-lg font-semibold` |
| Body text | `text-base` (forms, hero), `text-sm` (dense UI) |
| Muted/helper | `text-xs text-muted-foreground` |
| Eyebrow / uppercase label | `text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground` (use inline style for letter-spacing if Tailwind v4 hasn't compiled it) |
| Border radius (default) | `rounded-lg` |
| Border radius (large surface) | `rounded-2xl` |
| Border radius (pill) | `rounded-full` |
| Inline alert | `border-s-4 border-destructive bg-destructive/5 ps-5 pe-4 py-4` |
| Section gap | `gap-6` / `gap-8` |
| Field gap inside group | `gap-4` |

## Animation pairing

Animation should reinforce structure, not decorate. Pair with the `motion-framer` skill.

Subtle defaults that read as professional:
- **Page enter:** `initial={{ opacity: 0, y: 8 }}` + `animate={{ opacity: 1, y: 0 }}` with `transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}` (custom cubic — feels smoother than `easeOut`).
- **Section stagger:** parent variants with `staggerChildren: 0.06`. Don't go above `0.1` for tight sections — feels slow.
- **Field focus:** Tailwind handles this; don't motion-animate field focus.
- **Button press:** `whileTap={{ scale: 0.98 }}` only. Bigger scales feel toy-ish.
- **Form submit → success:** swap content via `AnimatePresence` with `mode="wait"`; entry uses `y: 8` + opacity.
- **Inline alert appear:** `initial={{ opacity: 0, height: 0 }}` + `animate={{ opacity: 1, height: "auto" }}` with `transition={{ duration: 0.25 }}`.

Anti-patterns to avoid:
- Anything bouncy (`type: "spring", bounce > 0.2`) on production UI. Springs read as 2018-era.
- Hover scale > 1.02. Subtle is professional.
- Animating multiple properties at different durations without reason. Pick one duration per scene.
- Looping ambient animations on backgrounds — they distract.
- Hero entrance choreography (3+ staggered children with custom delays). One stagger is enough.

## When to deviate

The patterns above are 21st.dev's house style — a safe default. Deviate when:

- The brief calls for a specific aesthetic (brutalist, glassmorphism, claymorphism) — invoke `ui-ux-pro-max` for the style's own ruleset.
- The product domain has its own vernacular (a fuel-pump telemetry dashboard should feel industrial; a wellness app should feel calm) — invoke `frontend-design` for subject-grounded direction.
- A specific gesture or animation choreography is core to the value prop — invoke `motion-framer`.

In all cases, density / two-tone / borders-over-shadows still applies unless the chosen style explicitly overrides them.
