// Curated bundle entry for design-sync (window.FlowDS).
//
// Why a hand-written entry instead of the converter's synth-entry:
//  1. fuel-flow-web is an app, not a published library — there's no dist entry and
//     no node_modules/fuel-flow-web, so the converter can't auto-resolve PKG_DIR.
//     Passing this file via --entry makes it walk up to the real fuel-flow-web/
//     package.json.
//  2. The converter's synth-entry would `export *` from EVERY src .tsx (routes,
//     stores, the axios api client, etc.) — bundling the whole app, with side
//     effects and import.meta.env usage that break a static bundle. This barrel
//     bundles ONLY the in-scope design-system components.
//
// `export *` per file so sub-components (CardHeader, DialogContent, SidebarMenu…)
// also land on window.FlowDS for use inside preview compositions. The 23 ROOT
// components shown as cards are pinned in .design-sync/config.json componentSrcMap.
//
// esbuild resolves the extensionless relative imports to .tsx, and @/… aliases
// via cfg.tsconfig (tsconfig.app.json). Keep this list in sync with componentSrcMap.

// Side-effect: initialize i18next (inline en/ur resources) so components that call
// useTranslation() — UpgradePrompt, UnderDevelopment — render real English in
// previews instead of raw "upgradePrompt.title" keys.
import '../src/lib/i18n';

// The app's custom ThemeProvider (NOT next-themes). Exposed on window.FlowDS so
// cfg.provider can wrap every preview in it — sonner's Toaster reads the theme via
// useTheme() and throws without this provider. Not a card (not in componentSrcMap).
export { ThemeProvider } from '../src/components/theme-provider';

// ── ui/ primitives ──────────────────────────────────────────────────────────
export * from '../src/components/ui/button';
export * from '../src/components/ui/input';
export * from '../src/components/ui/select';
export * from '../src/components/ui/card';
export * from '../src/components/ui/dialog';
export * from '../src/components/ui/alert';
export * from '../src/components/ui/badge';
export * from '../src/components/ui/checkbox';
export * from '../src/components/ui/dropdown-menu';
export * from '../src/components/ui/field';
export * from '../src/components/ui/label';
export * from '../src/components/ui/separator';
export * from '../src/components/ui/sheet';
export * from '../src/components/ui/sidebar';
export * from '../src/components/ui/skeleton';
export * from '../src/components/ui/sonner';
export * from '../src/components/ui/table';
export * from '../src/components/ui/tabs';
export * from '../src/components/ui/tooltip';

// ── reusable feature components ───────────────────────────────────────────────
export * from '../src/components/subscription/upgrade-prompt';
export * from '../src/components/forms/form-text-field';
export * from '../src/components/forms/form-select-field';
export * from '../src/components/common/under-development';
