# Fuel Flow DS — sync notes

- **Source shape**: this repo is a Vite SPA, not a packaged library. No `dist/index.js` / shipped `.d.ts` — the converter runs in **synth-entry mode** off `src/components/ui/*.tsx`.
- **CSS**: built Tailwind 4 output lives under `fuel-flow-web/dist/assets/index-<hash>.css`. The hash changes with each `vite build` — re-confirm `cssEntry` after rebuilding the app. Tailwind tokens are CSS-first in `src/index.css` (`@theme` block, oklch values for both `:root` and `.dark`).
- **Scope**: shadcn primitives only (`src/components/ui/*`). App-level compositions (`auth/`, `forms/`, `station-setup/`, `layout/`) are intentionally excluded — they're application code, not a reusable DS.
- **Path alias**: `@/*` → `./src/*` is set in both `tsconfig.json` and `tsconfig.app.json`. esbuild uses `tsconfig.app.json` for resolution because it has the active `include: ["src"]`.
- **Compound exports**: each shadcn file exports several PascalCase parts (e.g. `Alert` + `AlertTitle` + `AlertDescription` + `AlertAction`). The converter will register each as its own card — by design.
- **Providers needed for previews**: `TooltipProvider` (Tooltip), next-themes `ThemeProvider` (Toaster useTheme), `SidebarProvider` (Sidebar). If `[RENDER]` fires for those, wire them via `cfg.provider`.
- **Sonner.tsx** uses `next-themes` and the `style={}` design-token bridge — sanctioned exception per `src/components/CLAUDE.md`. Don't rewrite the token bridge during fixes.
