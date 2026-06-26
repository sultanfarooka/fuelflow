# Design Playground Mock Data

Mock fixtures for the `/design` playground. Each screen pulls its data from a
typed mock file rather than the real API client.

## Layout

```
src/design/mocks/
├── <mxx>/                # one directory per module
│   ├── <fxx>.ts          # mocks for an MXX-FXX screen, default-exports the
│   │                     # data the screen consumes
│   └── shared.ts         # (optional) fixtures reused across that module's screens
└── README.md
```

## Rules

1. **Type the mocks against the real DTOs.** Import the response type from
   `src/lib/api/...` and annotate the export. If the real DTO doesn't exist
   yet, define a local interface in the mock file and add a `// TODO: replace
   with real DTO when M??-F?? lands` comment so we catch the drift later.
2. **No imports from the playground into the real app.** Mocks live only
   under `src/design/`. Real routes and components must not import from this
   tree — Vite excludes the entire `src/design/` tree from production builds
   (see `src/routes/design/route.tsx` for the dev-only guard).
3. **Cover at least the empty / loading / error / populated states**
   per screen. A common pattern is to default-export the populated case and
   named-export `empty`, `loading`, `error` variants.
4. **Realistic Pakistani values.** Currency in PKR with comma grouping
   (`Rs. 1,25,000`), dates `DD/MM/YYYY`, Urdu strings where Urdu UI is in
   scope. Use shape-compatible fake data — don't invent fields the real API
   won't return.
