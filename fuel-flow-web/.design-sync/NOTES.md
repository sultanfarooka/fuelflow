# Fuel Flow DS — design-sync notes

Run all design-sync commands from the **`fuel-flow-web/` package root** (config paths are package-relative). Claude Design project: **"Flow Design System"** (`projectId` in `config.json`).

## Source shape & entry
- This repo is a **Vite SPA, not a packaged library** — no `dist/index.js`, no shipped `.d.ts`, and **no `node_modules/fuel-flow-web`** (npm won't self-install). The converter runs in package shape.
- **Always pass `--entry .design-sync/bundle-entry.mjs`.** Two reasons: (1) it makes the converter resolve `PKG_DIR` by walking up to the real `fuel-flow-web/package.json` (without it, `PKG_DIR=node_modules/fuel-flow-web` → `ENOENT` crash in `dts.mjs`); (2) it is a **curated barrel** that `export *`s only the in-scope component files. The converter's own synth-entry would `export *` every `src/**/*.tsx` (routes, stores, axios client) and bundle the whole app — fragile. **Keep `bundle-entry.mjs` in sync with `componentSrcMap`.**
- The barrel also `import '../src/lib/i18n'` (side effect → initializes i18next so `useTranslation()` renders real English in `UpgradePrompt`/`UnderDevelopment` instead of raw keys) and `export { ThemeProvider }` (for `cfg.provider`, below).
- `componentSrcMap` pins exactly the **23 root components**. With no `.d.ts`, that pinned set IS the component/card list. Sub-components (CardHeader, DialogContent, SidebarMenuButton, …) stay on `window.FlowDS` (120 exports) for use inside previews but don't get their own cards — intended.

## CSS (the load-bearing part)
- Everything is **Tailwind 4 utility classes + oklch tokens** (`src/index.css`, `@theme inline`, `:root`/`.dark`, Inter Variable). **No CSS-in-JS / CSS-modules**, so the converter's scraped `_ds_bundle.css` is empty — *all* styling comes from `cfg.cssEntry`.
- **`cfg.cssEntry = .design-sync/compiled.css`**, produced by **`node .design-sync/compile-css.mjs`** (uses the repo's own `@tailwindcss/postcss`; scans `src/**` **and** `.design-sync/previews/**` so preview-only utility classes are included). **Re-run compile-css before every `package-build.mjs`.**
- `compiled.css` MUST live one level under the package root (`.design-sync/`): the inlined Inter `@font-face` `url()`s are `../node_modules/...` (relative to `src/`), and the converter resolves cssEntry font urls against `dirname(cssEntry)`. A deeper dir (e.g. `.cache/`) breaks font copying. `compiled.css` is gitignored (regenerated each build).
- Fonts: Inter Variable via `@fontsource-variable/inter`; 7 woff2 copied to `fonts/`. No `[FONT_MISSING]`.

## Providers / context
- **`cfg.provider = ThemeProvider` (defaultTheme: "light").** The app's own `ThemeProvider` (custom context in `lib/theme-context.ts`, NOT next-themes). Required because `ui/sonner.tsx` (`Toaster`) calls `useTheme()` which throws without it. Forced light keeps headless renders deterministic.
- `Tooltip` and `Sidebar` previews compose their own `TooltipProvider` / `SidebarProvider` inline (no global provider needed for those).

## Per-component overrides
- `DropdownMenu`, `Select`, `Tooltip`: `{ cardMode: "single" }` — open/portal content escapes a grid cell (`[GRID_OVERFLOW]`). `single` is fully exempt from that check.

## Previews
- 23 authored previews in `.design-sync/previews/` (committed, markerless). 11 are the prior attempt's hand-authored ones (Dialog, DropdownMenu, Field, Label, Select, Sheet, Sidebar, Table, Tabs, Toaster, Tooltip — kept); 8 thin auto-generated floor-level previews were rewritten rich (Button, Alert, Badge, Card, Checkbox, Input, Separator, Skeleton); 4 reusables authored new (UpgradePrompt, FormTextField, FormSelectField, UnderDevelopment).
- New previews use **Tailwind utility classes** (the real DS idiom) — these compile because compile-css scans previews/.
- `FormTextField` / `FormSelectField` previews use a **plain mock object** matching TanStack Form's `FieldApi` (`.state.value`, `.state.meta`, `.name`, no-op handlers) — no live form needed.
- `Toaster` is a non-visual runtime container; its card honestly describes mount + usage. Graded good as a container.
- Removed the stale `GoogleIcon.tsx` preview — `ui/icons/google-icon.tsx` is out of the chosen scope.

## Known render warns
- None. `package-validate.mjs` exits 0 with 23/23 rendering cleanly. (If a new warn appears on re-sync, it's genuinely new — investigate.)

## Re-sync risks (what can silently go stale)
- **Component API drift:** if a shadcn primitive's exports/props change (e.g. a `npx shadcn add` re-sync), a preview composition can break. Re-run build+validate; the render check catches empties but not subtle prop renames — eyeball the contact sheets.
- **`bundle-entry.mjs` vs `componentSrcMap` drift:** adding/removing a component requires editing BOTH. A component in `componentSrcMap` but not `export`ed by the barrel renders blank (not on `window.FlowDS`).
- **Tailwind tree-shaking:** a preview using a brand-new utility class not elsewhere in `src/` only gets styled because compile-css scans `previews/`. If you bypass compile-css (e.g. point cssEntry at the app's `dist` CSS), those classes vanish. Always recompile.
- **i18n side effect:** if `src/lib/i18n.ts` moves or its init becomes async/lazy, `UpgradePrompt`/`UnderDevelopment` may regress to raw keys. Check those two cards after any i18n change.
- **next-themes dependency:** `package.json` still lists `next-themes` but the app uses its own ThemeProvider. Don't wire next-themes into `cfg.provider`.
- **Playwright/chromium:** render check used the cached `chromium-1223` matching `playwright@1.60.0`. A playwright bump needs the matching chromium build (`npx playwright install chromium`).
