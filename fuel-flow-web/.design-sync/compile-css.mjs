// Compiles a complete Tailwind 4 stylesheet for the design-sync bundle.
//
// Why this exists: fuel-flow-web styles everything with Tailwind utility classes +
// oklch tokens (src/index.css), with NO CSS-in-JS / CSS-modules. The design-sync
// converter's scraped component CSS is therefore ~empty, so ALL styling for the
// uploaded design system must come from a single compiled stylesheet set as
// cfg.cssEntry. We compile src/index.css with the repo's own Tailwind (via
// @tailwindcss/postcss) and explicitly scan BOTH src/** and the authored
// previews/** so every utility class used by components AND preview compositions
// is present (Tailwind tree-shakes to scanned content).
//
// Run from the fuel-flow-web/ package root:  node .design-sync/compile-css.mjs
// Output: .design-sync/compiled.css  (gitignored; cfg.cssEntry points here).
// It MUST live one level under the package root: the inlined Inter @font-face
// url()s are written as `../node_modules/...` (relative to src/), and the converter
// resolves cssEntry font url()s against dirname(cssEntry). Putting compiled.css in
// .design-sync/ makes `../node_modules` resolve to fuel-flow-web/node_modules; a
// deeper dir (e.g. .cache/) would break font copying.
// Re-run before every package-build.mjs so newly-authored preview classes are covered.

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd(); // fuel-flow-web
const indexCss = path.join(root, 'src', 'index.css');

// Resolve postcss + the Tailwind plugin from the repo's node_modules.
const require = (await import('node:module')).createRequire(pathToFileURL(path.join(root, 'noop.js')));
const postcss = (await import(pathToFileURL(require.resolve('postcss')))).default;
const tailwindPlugin = (await import(pathToFileURL(require.resolve('@tailwindcss/postcss')))).default;

const baseCss = fs.readFileSync(indexCss, 'utf8');

// Safelist the full semantic-token utility matrix. Tailwind tree-shakes to
// scanned content, but the Claude Design agent composes NEW UIs that may use any
// token utility — and rendered designs receive only this static stylesheet, so a
// utility absent here is silently unstyled. Force-generate bg/text/border/ring ×
// every token, plus opacity steps for the interactive ones.
const TOKENS = [
  'background', 'foreground', 'card', 'card-foreground', 'popover', 'popover-foreground',
  'primary', 'primary-foreground', 'secondary', 'secondary-foreground',
  'muted', 'muted-foreground', 'accent', 'accent-foreground', 'destructive', 'success',
  'border', 'input', 'ring',
  'sidebar', 'sidebar-foreground', 'sidebar-primary', 'sidebar-primary-foreground',
  'sidebar-accent', 'sidebar-accent-foreground', 'sidebar-border', 'sidebar-ring',
  'chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5',
].join(',');
const OPACITY_TOKENS = [
  'primary', 'secondary', 'muted', 'accent', 'destructive', 'success',
  'card', 'popover', 'sidebar', 'foreground', 'border', 'ring', 'input',
].join(',');
const safelist =
  `@source inline("{bg,text,border,ring,fill,stroke}-{${TOKENS}}");\n` +
  `@source inline("{bg,text,border,ring}-{${OPACITY_TOKENS}}/{5,10,20,30,40,50,60,70,80,90}");\n`;

// @source paths are relative to the input file (src/index.css) thanks to `from`.
const input =
  baseCss +
  '\n/* design-sync explicit content scan */\n' +
  '@source "./**/*.{ts,tsx}";\n' +
  '@source "../.design-sync/previews/**/*.{ts,tsx}";\n' +
  '\n/* design-sync safelist — full semantic-token utility matrix */\n' +
  safelist;

const result = await postcss([tailwindPlugin({ base: root })]).process(input, {
  from: indexCss,
  to: indexCss,
});

const dest = path.join(root, '.design-sync', 'compiled.css');
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, result.css);
console.log(`compiled ${result.css.length} bytes -> ${path.relative(root, dest)}`);
