---
description: Produce throwaway TSX design previews for one SRD feature, viewport by viewport (desktop → tablet → mobile) with a user-approval gate between each. Mounts under a dev-only /designs route.
argument-hint: "[MXX-FXX or MXX-FXX-RXX]"
---

# /design-feature — feature UI design generator (phased)

Generates **throwaway preview components** for one feature in `fuel-flow-web/src/designs/<MXX-FXX>/`, viewable via a dev-only `/designs` route. Designs use **real shadcn/ui components + Tailwind** with **mock data inline** — no API wiring, no Zod, no TanStack Query.

The command runs **one viewport at a time**:

1. **Desktop pass** — agent generates desktop + all states. User reviews and approves (or iterates).
2. **Tablet pass** — agent extends the file with tablet + all states. User reviews.
3. **Mobile pass** — agent extends the file with mobile + all states. User reviews. Done.

This avoids reworking 18 variants every time desktop changes. Approve early, lock it, move on.

The heavy work (file reads, generation, visual verify) runs in a spawned `general-purpose` agent. The main thread only resolves the ID, runs the approval loop, and asks `AskUserQuestion`s.

---

## When to run this command — and when to skip it

The playground pays for itself when the feature has all THREE of:

1. **≥3 meaningful visual states** (default / empty / loading / error / api-error / success).
2. **≥2 distinct viewport compositions** — mobile is NOT just narrowed desktop; there's a real layout shift (e.g. side brand panel → compact brand strip → mobile header + menu sheet).
3. **Motion choreography** — page-load fade, scene rotation, alert AnimatePresence, button progress wipe. Static screens don't benefit from the animation-tuning value.

Skip the playground when the feature is a **trivial screen**:

| Trivial screen | Do instead |
|---|---|
| Confirmation dialog ("Delete this tank?") | Build the real `<DeleteTankDialog>` in `src/components/…` |
| Single-action modal | Build the real component |
| Settings row / toggle | Build in the real settings panel |
| Empty-state placeholder / coming-soon | Build inline where it renders |
| Toast / Sonner notification | Compose in the actual mutation `onSuccess`/`onError` |
| 404 / error page | Build as the real route |
| Skeleton loader | Build inline; the real loading state IS the preview |
| Sidebar item, breadcrumb, navbar | Preview via a real route, not a standalone frame |

**Rule of thumb: if you can build the real component in less time than you'd spend mocking it in the playground, skip the playground.** Six variant frames for a screen that has one meaningful state is pure overhead — the ceremony costs more than the artifact.

Cross-cutting infra work (validators, hooks, background jobs, migrations, audit sinks) skips the playground entirely — there's nothing to render.

---

## Phase A — Main thread

### Step 0 — Load the plans (module + feature)

Before spawning the design agent, load BOTH planning artefacts in this order:

- **Module plan** at `docs/plans/<MXX>/module-plan.md` (produced by `/plan-module`) — authoritative for shared model (§2), shared UI shells (§3), event flow (§4), auth (§5), and cross-feature interactions (§1).
- **Feature plan** at `docs/plans/<MXX>/<MXX-FXX>.md` (produced by `/plan-feature`) — feature-specific screens, journey, backend flow, ACs, open questions.

#### 0a — Module plan (authoritative for shared decisions)

**If `module-plan.md` EXISTS** — always the primary reference:

- Extract §3 shared shells table — pass to the agent as `{MODULE_SHELLS}`. The agent MUST import these from `fuel-flow-web/src/designs/_shared/` rather than re-implementing.
- Extract §2 shared data model — pass as `{MODULE_MODEL}`. The design cannot invent new entity fields; mock data must use the shapes locked here.
- Extract §4 event flow row for this feature — pass as `{MODULE_EVENTS}`. Analytics/audit-adjacent copy must reference these event names.
- Extract §5 auth row for this feature — pass as `{MODULE_AUTH}`. Determines whether the design shows anonymous / authenticated / fresh-auth-gate chrome.
- Extract §8 planning-necessity routing decision for this feature — determines whether a feature `plan.md` is expected (Yes) or intentionally absent (No, module plan covers it).
- **Staleness check** — compare `plan_last_updated:` in module-plan frontmatter against the SRD spec's `Last updated`. If SRD is newer, warn: "Module plan may be stale — consider `/plan-module MXX --refresh` before continuing."

**If `module-plan.md` is MISSING** — proceed in relaxed mode:

- No shared-shell enforcement; the agent may need to define new patterns.
- Warn in the final summary: "No module plan — designs may drift from siblings. Run `/plan-module MXX` to lock shared decisions."
- For modules with ≥3 features in `docs/SRD.md` sharing entities/events/shells, offer to run `/plan-module MXX` first via `AskUserQuestion`.

#### 0b — Feature plan (screens + journey + open questions)

**If module-plan §8 said "No" for this feature** — feature plan is expected to be absent. Proceed with the module plan as sole reference. Do NOT warn about the missing feature plan.

**If module-plan §8 said "Yes" (or module plan missing) — check for feature `plan.md`:**

**If feature plan EXISTS** — perform a **staleness check**:

- Read `plan_last_updated:` from feature plan's YAML frontmatter.
- Read `**Last updated**` from the SRD spec's header table (or `Last Updated` from `docs/MODULES.md` for unmigrated modules).
- If SRD spec date > feature plan date, the plan is potentially stale. Ask the user via `AskUserQuestion`:
    - **Refresh the plan** (Recommended) — invokes `/plan-feature MXX-FXX --refresh`, which reads the updated SRD and updates the feature plan before proceeding
    - **Continue anyway** — plan is fine as-is; SRD change was cosmetic
    - **Cancel**

If current OR "continue anyway", proceed with extraction from the feature plan:

- **Screens table** — pass to the design agent as the authoritative screen list. The agent MUST generate exactly these screens; not fewer, not more. Deviations require re-running `/plan-feature` to update the plan first.
- **AC → surface mapping** — the agent uses this to know which ACs must be visible somewhere in the design. Backend-only ACs are moved to "Not designable" without asking.
- **Open questions** — if the plan lists unresolved `OQ-N:` items with no answer, surface them to the user via `AskUserQuestion` BEFORE spawning the agent.
- **User journey** — pass to the agent so CTA copy can name the next step correctly (e.g. "Continue to phone verification" points to M01-F02 because the journey names it).
- **Cross-feature dependencies** — surface to the user if any dependency is `drafting` or missing; ask whether to proceed.

**If feature plan is MISSING** but §8 said "Yes" (or module plan absent) — warn via `AskUserQuestion`:

- **Recommended: run `/plan-feature MXX-FXX` first, then re-run this command.**
- **Continue anyway** — the agent will infer screens from module plan + SRD spec. Works, but more iteration cycles.
- **Cancel.**

Include both paths in the agent prompt as `{MODULE_PLAN_PATH}` and `{PLAN_PATH}` (either may be "none"). Instruct the agent to read them in its context batch.

### Backpressure — escalation to SRD from the design agent

The design agent may discover during context-reading that the plan or SRD is inconsistent
(e.g. spec references an audit event that doesn't exist in M17, or requires a screen for an
AC that has no visible surface possible). Instead of hallucinating, the agent MUST emit an
`ESCALATE_TO_SRD:` block:

```
ESCALATE_TO_SRD:
Feature: MXX-FXX
Reason: <what's inconsistent — plan vs SRD, SRD vs another feature, missing detail>
Suggested action: <re-run /plan-feature, invoke /feature-discovery, edit spec directly>
State: <what phase you were in — desktop / tablet / mobile — so we can resume>
```

Main thread handles this exactly like `/plan-feature`'s escalation:

1. Saves phase progress to `docs/plans/<MXX>/.<MXX-FXX>-design-in-progress.md`.
2. Surfaces the escalation to the user.
3. On approval, either invokes `/plan-feature MXX-FXX --refresh` or `/feature-discovery`
   with the reason.
4. After SRD (and possibly plan) is updated, offers to resume the current phase or restart
   from Phase 0.

Do NOT let the design agent invent facts to work around a spec bug. Escalation is cheaper
than shipping a wrong design.

### Step 1 — Resolve the feature ID

The user invoked `/design-feature $ARGUMENTS`.

1. Parse `$ARGUMENTS`. Accept `MXX-FXX` or `MXX-FXX-RXX` (case-insensitive).
2. If missing or unparseable, use `AskUserQuestion` to ask which feature. Populate up to 4 options by reading `docs/SRD.md`'s feature tables — prefer features whose lifecycle is `drafting` and that don't yet have a folder in `fuel-flow-web/src/designs/`.
3. Never proceed without a confirmed ID. State the chosen ID in one sentence before continuing.

### Step 2 — Phased loop

Run three passes in order: `desktop`, `tablet`, `mobile`. For each pass:

1. Spawn the agent with `{PHASE}` set to the current viewport and `{PRIOR_VIEWPORTS}` set to the comma-separated list of viewports already approved (empty for desktop).
2. Wait for the agent's response. It will return one of:
   - `CLARIFY:` — questions for the user. Ask via `AskUserQuestion`, then re-spawn the SAME phase with `{USER_CLARIFICATIONS}` filled in. Max 2 clarify rounds per phase.
   - `PHASE_COMPLETE:` — agent finished this phase's variants. Proceed to step 3.
   - `BLOCKED:` — surface to user, abort the command.
3. Use `AskUserQuestion` to ask the user:
   - Question: "Approve `{PHASE}` variants for `{MXX-FXX}/<screen>`?"
   - Options:
     - **Approve and continue** — proceed to the next phase (or finish if mobile was just approved).
     - **Iterate on `{PHASE}`** — collect feedback. After they pick this, ask a follow-up free-text-friendly question: "What needs to change?" with 2–3 common-tweak options plus the auto-included Other field. Re-spawn the SAME phase with `{USER_FEEDBACK}` filled in.
     - **Skip remaining viewports** (only shown after a phase is approved; lets the user stop early — e.g. desktop-only feature).
4. After the mobile phase is approved (or after the user picks "Skip remaining"), print the final summary URL and stop. Do not commit, push, or open a PR.

### Step 3 — Agent prompt template

Spawn one Agent (`subagent_type: "general-purpose"`) per attempt. **The agent has no memory of this conversation** — the prompt must be fully self-contained. Substitute placeholders (`{MXX-FXX[-RXX]}`, `{PHASE}`, `{PRIOR_VIEWPORTS}`, `{USER_CLARIFICATIONS}`, `{USER_FEEDBACK}`) before sending.

```
You are generating UI design previews for Fuel Flow feature {MXX-FXX[-RXX]}.

CURRENT PHASE: {PHASE}
PRIOR APPROVED VIEWPORTS (must be preserved unchanged): {PRIOR_VIEWPORTS or "none"}
USER CLARIFICATIONS (this attempt only): {USER_CLARIFICATIONS or "none"}
USER FEEDBACK on prior attempt of this phase (apply these changes): {USER_FEEDBACK or "none"}

GOAL
----
The design file at fuel-flow-web/src/designs/{MXX-FXX}/<screen>.tsx must end this run with
variants for: {PRIOR_VIEWPORTS} + {PHASE}.

Per-phase behaviour:

- PHASE=desktop: greenfield. Plan the screen set, write one TSX file per screen with
  viewports=["desktop"] and the 6 states (default, empty, loading, error, api-409 / equivalent,
  api-429 / equivalent — substitute spec-relevant API errors if the spec implies different ones).
  Wire the /designs route (see ROUTE WIRING) if missing.
- PHASE=tablet: read each existing screen file under fuel-flow-web/src/designs/{MXX-FXX}/.
  EXTEND each file by:
    - Adding "tablet" to the `viewports` array.
    - Adding the tablet branch in the `RegistrationScreen`-style render switch (or equivalent
      composition function). Tablet is closer to mobile than desktop — single column unless the
      spec calls for split layout.
  Do NOT modify desktop variants in any way.
- PHASE=mobile: read each existing screen file. EXTEND each by:
    - Adding "mobile" to the `viewports` array.
    - Adding the mobile branch — a FIRST-CLASS PWA composition, not a shrunk desktop. See
      "MOBILE IS NOT A NARROW DESKTOP" below.
  Do NOT modify desktop or tablet variants.

If USER_FEEDBACK is non-empty, this is an iteration on the CURRENT phase — apply the listed
changes only to the {PHASE} variants; do not touch other viewports.

CONTEXT TO READ (parallel batch)
--------------------------------
1. Spec — preferred: glob `docs/srd/M{XX}-*/F{XX}-*.md`. Fallback: `docs/MODULES.md` section
   `M{XX}-F{XX}` if the SRD file doesn't exist AND the module is listed under "Unmigrated" in
   `docs/SRD.md`. If neither exists, return: `BLOCKED: feature {id} has no SRD or MODULES.md entry`.
2. Module README at `docs/srd/M{XX}-*/README.md` if it exists.
2a. **Module plan** at `{MODULE_PLAN_PATH}` if it exists (main thread substitutes the
    path or "none"). When present, it is AUTHORITATIVE for cross-feature decisions and
    OVERRIDES anything you might infer from the spec alone:
     - §2 Shared data model — mock data in your TSX MUST use the field shapes locked
       here. Do NOT invent new entity fields; if the spec seems to imply one that
       isn't in §2, escalate via `ESCALATE_TO_SRD:`.
     - §3 Shared UI shells — the shells listed here already exist under
       `fuel-flow-web/src/designs/_shared/`. Import them; do NOT re-implement any shell
       whose name appears in the table.
     - §4 Event flow — analytics/audit-adjacent copy references these event names.
     - §5 Auth matrix — determines whether the design renders anonymous, authenticated,
       or fresh-auth-gate chrome. Fresh-auth gate features render the
       `PasswordReAuthPrompt` shell.
     - §8 Planning necessity — tells you whether a feature plan.md is expected. If §8
       says "No" for this feature, `{PLAN_PATH}` will be "none" by design; use the
       module plan + SRD spec as your scope contract.
   If the module plan is "none", fall back to relaxed mode (spec + feature plan only).
2b. **Feature plan** at `{PLAN_PATH}` if it exists (main thread substitutes the path or
   "none"). When a feature plan exists, it is the AUTHORITATIVE per-feature scope:
     - Generate exactly the screens listed in the plan's Screens table — no additions,
       no omissions.
     - Use the AC → surface mapping to know what must be visible. Backend-only ACs are
       already flagged; list them in "Not designable" without further analysis.
     - Any open questions in the plan have already been resolved by the main thread
       before spawning you — treat them as answered.
     - The user journey in the plan tells you how the CTA should name the next step.
     - Where the feature plan says "inherits from module-plan §2" or "see module-plan
       §1", refer back to `{MODULE_PLAN_PATH}` for the authoritative shape.
   If the feature plan is "none" AND module-plan §8 said "No" for this feature, use
   the module plan + SRD spec directly (this is the intended flow — not a fallback).
   If both are "none", fall back to inferring screens from the spec (fully relaxed).
3. `fuel-flow-web/CLAUDE.md` — stack, breakpoints, theme tokens, RTL rules.
4. `fuel-flow-web/src/routes/CLAUDE.md` — role/route conventions for this feature.
5. `fuel-flow-web/src/components/CLAUDE.md` — Field system, Dialog/Sonner patterns.
6. `fuel-flow-web/src/lib/CLAUDE.md` — utilities (`cn`).
7. `Glob fuel-flow-web/src/components/ui/*.tsx` — installed shadcn primitives.
8. Existing design files at `fuel-flow-web/src/designs/{MXX-FXX}/**/*.tsx` (mandatory for
   tablet + mobile phases; the file you are extending must be read first).
9. Other prior designs in same module: `fuel-flow-web/src/designs/M{XX}-*/**/*.tsx` —
    match their visual language UNLESS the user explicitly asks for a redesign (then ignore
    cross-module consistency).
10. **CANONICAL REFERENCE — always read on desktop phase even if you're working on a
    different module**: `fuel-flow-web/src/designs/M01-F01/registration-form.tsx`. This file
    is the house-style reference for the entire application. The DESIGN CONVENTIONS section
    of these instructions distills it; the file itself shows the exact implementation
    (animation constants block, ViewportFrame with Replay button, PasswordInput, alert
    composition, FuelFlowMark, brand panel with rotating scenes, etc.). Mirror its structure
    and naming for consistency.

SKILLS TO INVOKE (via the Skill tool, in this order)
----------------------------------------------------
The design agent MUST invoke these skills as part of context-gathering, before writing code.
Each one returns guidance the agent then synthesises into the design. Do not invoke them all
greedily — pick what the current phase needs:

1. `frontend-design` — invoke ALWAYS at the start of the desktop phase. Sets the aesthetic
   direction (palette, typography, signature element) anchored in the feature's domain. Read
   its output before designing.
2. `ui-ux-pro-max` — invoke when picking a style (glassmorphism, minimalism, brutalism, etc.)
   or when planning color palettes / font pairings. Especially useful at the start of the
   desktop phase. Cite which UI style + which palette you chose in the summary.
3. `twenty-first-dev` — invoke ALWAYS. House-style guidance for shadcn/Tailwind composition:
   density, two-tone palettes, borders-over-shadows, inline-alert structure. Apply throughout.
4. `ui-styling` — invoke for shadcn primitive lookup, theming, accessibility patterns. Use as
   a reference when uncertain about a primitive's API.
5. `motion-framer` — invoke ALWAYS in every phase. Designs must include subtle motion (page
   enter, section stagger, button press, alert appear) using the `motion` package (already
   installed as `motion` in `fuel-flow-web/package.json` — import from `"motion/react"`).
   The animation defaults in `twenty-first-dev` are non-negotiable: no springs with bounce,
   `whileTap={{ scale: 0.98 }}` only, custom cubic ease `[0.16, 1, 0.3, 1]` for page enters.

APPLICATION-WIDE DESIGN CONVENTIONS (mandatory — established in M01-F01)
------------------------------------------------------------------------
These patterns were settled during the M01-F01 redesign and are now the house style for
EVERY feature design. Read `fuel-flow-web/src/designs/M01-F01/registration-form.tsx` as the
canonical reference; mirror its structure unless the spec genuinely requires a different
composition. List any deliberate deviation in the summary.

ZERO. SHARED SCAFFOLDING (mandatory — never duplicate)
------------------------------------------------------
The shared design scaffolding lives at `fuel-flow-web/src/designs/_shared/` and the brand
mark lives at `fuel-flow-web/src/components/brand/fuel-flow-mark.tsx`. New feature designs
MUST import from these — never re-implement them inline. If you find yourself copying a
component named `ViewportFrame`, `BrandPanel`, `BrandHeader`, `PasswordInput`,
`PasswordChecklist`, `Stepper`, `SceneDots`, `PreviewHeader`, `ViewportSectionHeading`, or
the animation constants block, STOP — they already exist in `_shared/` and you must import
them instead.

Allowed imports (barrel exported from `@/designs/_shared`):
  - Types: `Viewport`, `VIEWPORT_WIDTHS`
  - Animation: `PAGE_LOAD_DURATION`, `SCENE_TRANSITION_DURATION`, `SCENE_GRADIENT_DURATION`,
    `SCENE_ICON_POP_DURATION`, `EASE_OUT_QUART`, `EASE_OUT_BACK`, `SHAKE_KEYFRAMES`,
    `INPUT_FOCUS_RING`, `screenVariants`, `columnVariants`, `itemVariants`, `alertVariants`
  - Brand scenes: `BRAND_SCENES`, `SCENE_GRADIENTS`, `SCENE_INTERVAL_MS`, `useBrandScene`,
    `BrandScene` type
  - Preview chrome: `ViewportFrame`, `PreviewHeader`, `ViewportSectionHeading`
  - Brand surfaces: `BrandPanel`, `BrandHeader`, `SceneDots`
  - Form bits: `PasswordInput`, `PasswordChecklist` (accepts custom `rules` if you need a
    different password policy), `Stepper` (accepts custom `steps` per flow)
  - Brand mark: `import { FuelFlowMark } from "@/components/brand/fuel-flow-mark"`

What you write INSIDE the feature design file:
  - State enum + STATE_BADGE map (feature-specific labels)
  - Mock data constants (SAMPLE_VALUES, ERROR_VALUES, EMPTY_VALUES)
  - `STEPS` array for Stepper (e.g. `[{ id: 1, label: "Account" }, { id: 2, label: "Verify
    phone" }]`)
  - Top-level Design component + `RegistrationScreen`-style viewport branches
  - FormColumn (or equivalent) with feature-specific fields, validation, and state logic
  - Feature-specific alerts (e.g. `DuplicatePhoneAlert`, `RateLimitedAlert`)
  - Feature-specific copy and text

If you need a NEW shared bit (e.g. a fourth viewport, a new shared component), add it to
`_shared/` and re-export from `index.ts`. Don't pollute feature files with scaffolding.

A feature design file that exceeds ~500 lines is a code smell — extract the next shared
piece or split the screen into multiple TSX files in the same `{MXX-FXX}/` folder.

A. ANIMATION TIMING — exposed as named constants at the top of every design file:

      const PAGE_LOAD_DURATION = 1.4;        // page fade-in on mount / Replay
      const SCENE_TRANSITION_DURATION = 1.0; // brand-panel scene swap (icon + title + body)
      const SCENE_GRADIENT_DURATION = 2.6;   // radial-gradient tint cross-fade
      const SCENE_ICON_POP_DURATION = 0.85;  // overshoot pop on the scene icon tile
      const SCENE_INTERVAL_MS = 5000;        // how long each scene stays
      const EASE_OUT_QUART = [0.16, 1, 0.3, 1] as const;
      const SHAKE_KEYFRAMES = [0, -4, 4, -4, 4, 0];
      const INPUT_FOCUS_RING = "transition-[box-shadow,border-color] duration-200 ease-out";

   These constants live in a labeled `ANIMATION TIMING` block above the variants. The user
   tunes the feel by editing these — never bake durations as magic numbers in transitions.

B. PAGE LOAD = ONE BLOCK FADE (no per-item stagger):
   - `screenVariants`, `columnVariants`, `itemVariants` all use `duration: PAGE_LOAD_DURATION`
     and NO `staggerChildren` / `delayChildren`.
   - Inner form items are PLAIN `<div>`/`<form>`/`<label>` — NOT `<motion.div variants={…}>`.
   - The whole form fades in as one unit. Top-to-bottom cascading is explicitly out.
   - Exceptions that DO need motion.div: shake wrappers around errorable Fields, and the
     CTA hover/tap wrapper. Both use direct `animate`/`whileHover`/`whileTap` props, not
     variants — so they don't participate in any cascade.

C. BRAND PANEL STRUCTURE (left column on desktop + tablet):
   - Logo at top: `<FuelFlowMark className="size-9 text-primary" /> + Fuel Flow wordmark`
   - Rotating scene area with 3 scenes (icon tile + title + 1-line description) cycling every
     `SCENE_INTERVAL_MS`. Use `AnimatePresence mode="wait"` keyed on `sceneIdx`.
   - Scene icon: `<motion.span initial={{ scale: 0.55, rotate: -18 }} animate={{ scale: 1,
     rotate: 0 }} transition={{ duration: SCENE_ICON_POP_DURATION, ease: [0.34, 1.56, 0.64,
     1] }}>` — overshoot pop on every scene change.
   - Scene dots indicators below (`<SceneDots>` — clickable, active dot expands to ~28px in
     `--primary`, inactive at 8px in `bg-background/25`).
   - Ambient gradient: 3-element `SCENE_GRADIENTS` array, one gradient per scene. Cross-fade
     via `AnimatePresence` with `transition={{ duration: SCENE_GRADIENT_DURATION }}`.
   - Footer at bottom (e.g. copyright + version stamp).
   - `compact` prop reduces padding (`p-7` vs `p-10`), heading (`text-2xl` vs `text-3xl`),
     and description max-width — used by tablet branch.

D. FORM STRUCTURE (right column / single column):
   - Stepper at top showing current step + next ("1 Account · 2 Verify phone" for auth flows).
     The connector line has an indeterminate shimmer bar: small primary segment animates
     `x: ["-40%", "110%"]` with `repeat: Infinity` + `repeatDelay`. Suggests "in progress".
   - Heading + 1-line subhead.
   - PAIRED-FIELD rows where logical (`grid grid-cols-2 items-start gap-4`):
     First/Last name • Mobile/Email • Password/Confirm password.
   - All Inputs get `className={INPUT_FOCUS_RING}`.
   - Password fields use `<PasswordInput>` (Input + absolutely-positioned eye toggle at
     `end-1`, `IconEye`/`IconEyeOff`).
   - Field error shake: wrap errorable Fields in
     `<motion.div animate={error ? { x: SHAKE_KEYFRAMES } : { x: 0 }} transition={{
     duration: 0.45, ease: "easeInOut" }}>`.
   - Password checklist (`<PasswordChecklist>`): renders ONLY the satisfied rules (filter by
     `pass`), nothing when none pass. Uses `AnimatePresence` + `layout` so items slide in
     when a rule becomes satisfied. If `passwordError` is set, render `<FieldError>` instead
     of the checklist.
   - Field descriptions / helper text: SHORT (single line in paired-column width). Examples:
     "11 digits starting with 03." / "For account recovery." / "Re-enter to confirm."
   - T&C: single block `<label>` with checkbox + inline-flowing text (Terms, Privacy as
     inline links). NEVER a flex parent — that breaks link wrapping.
   - Continue CTA:
       - `<Button className="relative h-11 w-full overflow-hidden">`
       - Indeterminate progress overlay (`motion.span` traveling `left: ["-40%", "110%"]`)
         visible when `isLoading`.
       - Inner span with `relative` positioning so text sits above the wipe.
       - Wrapped in a `motion.div` with `whileHover={{ y: -1 }}` + `whileTap={{ scale:
         0.98 }}`, both gated on `!isLoading && !showApiError`.
   - Sign-in link: "Already have an account? Sign in" as a plain `<div>` (no motion).

E. INLINE ALERT (4xx errors) — position ABOVE the CTA, BELOW the form fields:
   - `<AnimatePresence mode="wait">` wrapping a `motion.div` with `alertVariants`
     (height + opacity + small y-offset, 250ms).
   - Alert composition wraps the icon to defeat shadcn's `has-[>svg]` grid override:
       `<Alert variant="destructive" className="border-destructive/40 bg-destructive/5">`
       `  <div className="flex items-center gap-2"><Icon /><AlertTitle className="m-0">…`
       `  <AlertDescription className="mt-2">…`
       `  <div className="mt-3 flex flex-wrap gap-2">…recovery buttons…</div>`
       `</Alert>`
   - Recovery action `Button variant="outline"` should set `className="bg-background"` so it
     stands out against the tinted alert background.

F. FULLSCREEN MODE CONTRACT (the design + splat viewer agree):
   - Design accepts `fullscreen?: boolean` prop in addition to `focusVariantId?`.
   - When `fullscreen && focused`: render `<RegistrationScreen … fullscreen />` directly,
     NO PageHeader and NO ViewportFrame wrapper.
   - Inside RegistrationScreen, the grid uses `cn(..., fullscreen && "min-h-screen")` and
     `style={{ minHeight: fullscreen ? undefined : 760 }}` — fills the viewport when
     fullscreen, capped at 760 inside the preview frame.
   - FormColumn uses `items-center` when fullscreen, `items-start` otherwise.
   - The splat viewer (`routes/designs.$.tsx`) reads `fullscreen=1` via `validateSearch`
     and passes it as the prop. Per-frame "Fullscreen" link opens `?variant=X&fullscreen=1`
     in a new tab. "Exit fullscreen" pill sits `fixed bottom-4 end-4 z-50`.

G. VIEWPORT FRAME CONTROLS (in non-fullscreen preview):
   - Each frame has a header row with: viewport badge, state badge, `#variant-id` mono badge,
     **Replay** button (rotates `IconRefresh` -360° on click, bumps an internal key to
     re-mount children — re-triggers all enter animations), Fullscreen link to
     `?variant=X&fullscreen=1` in new tab.
   - Solo mode keeps the "← All variants" link in place of Fullscreen.

H. BRAND IDENTITY:
   - `FuelFlowMark` SVG (shield with pump nozzle / drop / chart-arrow knockouts via mask).
     Uses `currentColor`, no raster. Inline component in design files; canonical asset at
     `fuel-flow-web/public/fuel-flow-mark.svg`.
   - "Fuel Flow" wordmark is plain HTML text in Inter — NEVER part of the SVG (avoids the
     "FUE FLOW" typo problem from the source artwork).
   - Wordmark is `text-base font-semibold tracking-tight` next to the mark.

I. PHONE FORMAT (Pakistani context):
   - Local format `03XXXXXXXXX` (11 digits starting with 03).
   - Input: `type="tel" inputMode="numeric" autoComplete="tel" maxLength={11}`.
   - Placeholder: `"0300 1234567"`.
   - Validation message (when in error): `"Mobile number must be 11 digits starting with 03
     (e.g. 03001234567)."`.

J. DARK MODE (mandatory — every design must work in BOTH themes):
   - The splat viewer + ViewportFrame support a `?theme=dark` query and a per-frame Dark/Light
     toggle. Designs must render correctly under both themes.
   - The preview wrapper applies `.dark` on a deep div, so the body-inherited color does NOT
     re-evaluate. The wrapper that carries `.dark` must ALSO carry `bg-background text-foreground`
     to force the variables to be re-read at that point. The viewer already does this; don't
     remove it.
   - Theme-token rules INSIDE the design:
       * Use semantic tokens (bg-background, text-foreground, bg-card, text-muted-foreground,
         bg-destructive/5, border-destructive/40, etc.) for EVERY surface and text color. Never
         hardcode hex or named tailwind colors (gray-N00, zinc-N00). This is enforced
         repo-wide — see `components/CLAUDE.md` "Theming rules".
       * Tokens auto-flip in dark mode — most surfaces just work.
       * EXCEPTION: a brand panel / dark header that should stay dark in BOTH themes uses
         `bg-foreground text-background` for light mode but flips back to dark via explicit
         `dark:bg-background dark:text-foreground` overrides. Same for opacity variants:
         `text-background/75 dark:text-foreground/75`, `bg-background/10 dark:bg-foreground/10`,
         `ring-background/15 dark:ring-foreground/15`, etc. Apply this pattern to every
         theme-token usage inside a brand-fixed-dark surface.
   - Don't use a hardcoded near-black (`#000`, `bg-black`, `bg-zinc-950`) for the brand panel.
     The `bg-foreground dark:bg-background` pattern keeps it on-token and themable.
   - The `dark:` variants in the design files use the project's `@custom-variant dark
     (&:is(.dark *))` setup — they activate when ANY ancestor has the `.dark` class. No extra
     plumbing needed.

When a feature's spec doesn't need a brand panel (e.g. a dashboard widget, a settings modal,
a confirmation dialog), drop the brand-panel block but keep the other conventions intact
(timing constants, fade-as-one-block, paired fields, motion idioms, fullscreen contract,
viewport frame controls).

MOTION USAGE
------------
Designs may import from `motion/react`:

  import { motion, AnimatePresence } from "motion/react";

Always apply at minimum:
- A page-enter on the outermost design wrapper (opacity + small y-offset, 400ms custom cubic).
- A staggered enter on form/section children (60ms stagger, max 100ms).
- `whileTap={{ scale: 0.98 }}` on the primary CTA only.
- `AnimatePresence` for any conditionally-rendered alert (inline 4xx errors), with the
  alert-appear preset from `twenty-first-dev`.

Mock event handlers may be `() => {}` — designs are non-interactive previews.

DECIDE WHETHER TO ASK QUESTIONS FIRST
-------------------------------------
After reading the spec (and existing file, if extending), before writing, decide whether you
have enough to design well. CLARIFY when:
  - The spec leaves material UX choices ambiguous for this phase.
  - A natural component choice is contested (Dialog vs Sheet vs Drawer; inline form vs wizard).
  - For mobile phase specifically: the desktop composition is ambiguous to translate (e.g. a
    split layout could become a tab-bar OR a single scrolling column OR a multi-step flow).
  - Microcopy / tone matters and the spec is silent.
  - A required shadcn primitive is not installed.

Do NOT clarify for: styling details, edge cases that can be designed as stacked variants,
choices the spec already makes.

CLARIFY format (return this and stop):
  CLARIFY:
  - Q1: <question> | options: <a> / <b> / <c>
  - Q2: <question> | options: <a> / <b>
  Max 3 questions, 2–4 concrete options each.

If you do not clarify, proceed to GENERATE.

GENERATE
--------
1. PHASE=desktop only: enumerate every screen the feature requires (pages, dialogs, drawers,
   role variants, distinct states with materially different layouts). List them at the start of
   your response. For tablet/mobile phases, the screen set is already locked — work from the
   files that exist.
2. Write or extend one TSX file per screen at fuel-flow-web/src/designs/{MXX-FXX}/<kebab>.tsx.
3. Rules every file must follow:
   - Only shadcn primitives confirmed present in components/ui/ (import via @/components/ui/...).
   - Tabler Icons (@tabler/icons-react).
   - cn() from @/lib/utils for conditional classes.
   - Semantic theme tokens only (bg-card, text-muted-foreground, border-border, text-destructive,
     bg-primary, etc.) — never raw hex, never gray-N00.
   - Logical RTL utilities only (ms-, me-, ps-, pe-, start-, end-, text-start, text-end) — never
     ml-, mr-, pl-, pr-, left-, right-, text-left, text-right.
   - Mock data inline at the top of the file. No imports from @/lib/api.
   - Default export named `<ScreenName>Design`.
   - Zero comments explaining what the code does or referencing the task.
4. Every R-level acceptance criterion in the spec must be visible somewhere across the variants
   designed so far (a field, a state, a confirmation, an error). If a requirement is backend-only,
   list it under "Not designable" in the summary.

MOBILE IS NOT A NARROW DESKTOP (PWA principle — mandatory for mobile phase)
--------------------------------------------------------------------------
Fuel Flow runs as an installed PWA on Pakistani phones. The mobile variant of a screen is a
FIRST-CLASS COMPOSITION, not stack-on-narrow CSS applied to the desktop layout. The visual
verify step will fail the design if any of these anti-patterns slip through:

- Alert/error blocks with <icon-left, body-right> flex composition at mobile widths. The icon
  column eats the body column and text wraps to single-word lines. On mobile: stack the icon +
  heading on one row, body underneath, actions as a vertical stack.
- First/Last name (or any logically-paired fields) rendered side-by-side at mobile widths.
  Stack vertically below ~640px.
- Marketing / brand side-panels visible on mobile. Hide, do not shrink.
- Inline link runs ("I agree to the Terms of Service and Privacy Policy") inside a flex parent
  on mobile. Use a single block-level <p> so the text flows as inline content.
- Two-column footer rows on mobile. Stack.
- Densely-packed icon+title headers where the icon consumes 20%+ of width.
- Touch targets under 44px tall.

Tablet (~768px) is closer to mobile than to desktop: single column with denser typography
unless the spec calls for split layout.

VARIANT CONTRACT (mandatory — the splat viewer depends on it)
-------------------------------------------------------------
Each design file must conform to this contract:

  type DesignProps = { focusVariantId?: string };
  const <ScreenName>Design = ({ focusVariantId }: DesignProps = {}) => { ... };
  export default <ScreenName>Design;

- `viewports` array contains exactly the viewports designed so far for this screen (e.g. for
  the desktop phase: ["desktop"]). Variant IDs are lowercase, hyphen-joined: `desktop-default`,
  `mobile-error`, `tablet-api-429`.
- Optional `focusVariantId` prop. When matching a variant, render ONLY that one frame with the
  PageHeader still above. When unset, stack all current-phase + prior-approved variants.
- Each viewport-state frame (in both all-variants and solo modes) must:
  - Set `id={variantId}` and include `scroll-mt-20` in className.
  - Show viewport, state, and `#variant-id` badges in a header row.
  - Render a trailing-edge action (`ms-auto`):
    - All-variants mode: `<a href={\`?variant=\${variantId}\`}>` with `IconArrowsMaximize`,
      label "View solo".
    - Solo mode: `<a href="?">` with label "← All variants".
  - Plain `<a>` only — NEVER import TanStack Router's `<Link>` in a design file.

ROUTE WIRING (only on the desktop phase, only if missing)
---------------------------------------------------------
The /designs route uses TanStack's parent-layout + index + splat pattern (three sibling files):

  routes/designs.tsx        — pathless layout: gates on import.meta.env.DEV, renders <Outlet />
  routes/designs.index.tsx  — `/designs` index: `import.meta.glob('../designs/**/*.tsx')`,
                              groups by MXX-FXX folder, renders the design list
  routes/designs.$.tsx      — `/designs/$splat` viewer: lazy-loads the matched design,
                              reads `?variant=<id>` via `validateSearch`, passes it as the
                              `focusVariantId` prop to the design component

Why three files: TanStack file-based routing nests `designs.$.tsx` under `designs.tsx`. If
`designs.tsx` rendered the index list directly (instead of `<Outlet />`), the splat child would
never render. The index lives in `designs.index.tsx` as the `/` child of the layout.

If any are missing, create them. If they exist, `import.meta.glob` discovers new design files
automatically.

VERIFY — STATIC (parallel, every phase)
---------------------------------------
- `cd fuel-flow-web && npx tsc --noEmit`
- `cd fuel-flow-web && npm run lint`
Fix any errors in the touched files only.

VERIFY — VISUAL (Playwright MCP, every phase)
---------------------------------------------
1. Detect dev server. Probe http://localhost:5173. If reachable, REUSE. If not, start
   `cd fuel-flow-web && npm run dev` in background and poll every 2s for up to 60s. If still
   down after 60s, mark visual verify as `SKIPPED — dev server unreachable` and continue to
   RETURN FORMAT. Leave the server running.

2. Smoke-probe the routes (`mcp__playwright__browser_navigate`):
   a. http://localhost:5173/designs — assert the index lists the new `{MXX-FXX}` folder.
   b. http://localhost:5173/designs/{MXX-FXX}/<first-screen> — assert page renders with the
      spec header (feature ID badge + title) visible.
   c. …?variant=<first-{PHASE}-variant-id> — assert solo mode renders only that frame.
   Any failure (404, blank, wrong content) → return
   `BLOCKED: visual verify failed at <url> — <reason>`.

3. SCOPED visual verify — do NOT screenshot every variant. Cost is real (each image Read is
   ~1.5–3k tokens). The phased workflow already limits us to the current viewport; further
   trim by state:

   Initial generation of this phase — screenshot these 3 variants only:
     - `{phase}-default` — the happy-path baseline
     - `{phase}-error` — inline field errors, often the first thing that breaks at narrow widths
     - `{phase}-api-409` — has the most additional UI chrome (alert + recovery buttons)

   Skip on initial generation: `empty`, `loading`, `api-429`. They reuse the same composition
   as `default` and `api-409`; if those pass, these are very likely fine.

   Iteration pass (USER_FEEDBACK is non-empty) — screenshot ONLY:
     - The variants the user explicitly referenced (e.g. "fix #desktop-api-429" → just that one)
     - The single variant most affected by the change

   In both cases, save each screenshot to `.playwright-mcp/design-{MXX-FXX}-{variantId}.png`
   (already gitignored — don't drop at repo root).

   For each chosen variant:
   a. browser_navigate to the solo URL ?variant=<id>.
   b. browser_take_screenshot to `.playwright-mcp/design-{MXX-FXX}-{variantId}.png`.
   c. Read the screenshot back. Inspect for ANY of:

      Layout / spacing:
      - Misaligned elements (form fields not aligned to labels, columns off-grid, baselines off).
      - Inconsistent vertical rhythm — large gaps next to tight gaps without intent.
      - Cards, alerts, or fields extending past the viewport frame width.
      - Content butted against the frame edge with <~16px padding.
      - Touch targets <44px tall on mobile/tablet.

      Typography:
      - Horizontal text overflow / cramming — text wrapping into single-word lines.
      - Heading sizes identical to body text (lost hierarchy).
      - Line lengths >~80ch on desktop.
      - Unintended truncation (`…`).

      Composition:
      - Buttons or labels stacking into >2 lines that should fit one.
      - Side-by-side composition from desktop surviving at narrower widths (icon-left+body-right
        alerts, paired fields, two-column footers, side panels).
      - Densely-packed icon+title rows where the icon eats 20%+ of width.
      - Empty / loading / error states visually identical to default (state not communicated).

      State-specific:
      - Loading: no spinner / skeleton visible.
      - Error: no error styling (color + icon + message).
      - Empty: no empty-state copy or CTA.
      - API errors: not distinct from field errors — must be a top-of-screen alert with a
        recovery action.

   d. If ANY issue is observed, ADD to `Visual issues` in the summary AND FIX the design before
      declaring this phase done. Re-screenshot ONLY the fixed variant — NOT the full set.
      Loop only on that variant until clean.

   If the issue suggests the bug might apply across other variants (e.g. an Alert grid bug, a
   shared component breaking), expand the screenshot set just enough to confirm — usually +1
   variant that shares the suspect component. Do not preemptively re-screenshot the whole row.

4. Read browser console errors (`mcp__playwright__browser_console_messages level=error`) ONCE
   at the end. Any error → fix and re-probe the affected variant only.

5. Delete the `.playwright-mcp/design-*.png` screenshots after verification (the directory
   itself stays — it's the MCP cache).

Iteration cost ceiling: a clean phase pass should consume 3–4 screenshots (one per chosen
variant). A pass with one fix consumes 4–6 (initial 3 + the fixed variant re-screenshot, ×2
if a second iteration is needed). If you find yourself burning 10+ screenshots in one phase,
stop and surface the situation — something is structurally wrong with the design, not just
one variant.

RETURN FORMAT
-------------
Return a single response in this exact shape:

  PHASE_COMPLETE: {PHASE}
  Feature: {MXX-FXX[-RXX]} — <one-line description>
  Spec source: <path>

  Phase: {PHASE}
  Variants generated this phase (6):
  - {phase}-default
  - {phase}-empty
  - {phase}-loading
  - {phase}-error
  - {phase}-api-XXX
  - {phase}-api-XXX

  Composition summary for {PHASE}: <one or two sentences on the layout choices for this viewport>

  Visual issues found and fixed this phase: <list or "none">
  Visual issues still present (must be fixed before approval): <list or "none">

  Cumulative viewports designed so far: {PRIOR_VIEWPORTS + PHASE}
  Missing shadcn primitives (substituted): <list or "none">
  Not designable (backend-only ACs, cumulative): <list or "none">
  Type-check + lint: PASS / FAIL with details
  Dev server status: REUSED on :5173 / STARTED on :5173 / SKIPPED — <reason>

  Open this in dev (all variants stacked):
    http://localhost:5173/designs/{MXX-FXX}/<first-screen>
  First variant of this phase, solo:
    http://localhost:5173/designs/{MXX-FXX}/<first-screen>?variant={first-phase-variant-id}

DO NOT commit, push, or open a PR. Do not stop the dev server.
```

### Step 4 — Approval-loop handling in the main thread

After each agent return:

- **`CLARIFY:`** — parse, ask user via `AskUserQuestion`, re-spawn the SAME phase with answers in `{USER_CLARIFICATIONS}`. Max 2 clarify rounds per phase.

- **`BLOCKED:`** — relay to user, abort the command.

- **`PHASE_COMPLETE:`** — print the summary to the user verbatim, then ask via `AskUserQuestion`:

  Question: "{PHASE} variants for {MXX-FXX}/<screen> are ready at {URL}. What next?"
  Options:
  - **Approve {PHASE}, continue to {NEXT_PHASE}** (Recommended)
  - **Iterate on {PHASE}** — re-run this phase with your feedback
  - **Approve {PHASE} and stop here** — finish without designing remaining viewports (use when the screen genuinely doesn't need them)

  If "Iterate" selected: ask one follow-up `AskUserQuestion` titled "What needs to change?". Provide 2–3 plausible quick-tweak options based on the summary's `Visual issues` list (or the screens generated) plus the auto-included Other field for free text. Re-spawn the same phase with `{USER_FEEDBACK}` populated from the user's selection + Other text.

  If "Approve, continue" selected: bump phase (desktop → tablet → mobile) and re-spawn.

  If "Approve and stop" selected: print a final wrap-up referencing the cumulative URL and end.

  After mobile phase is approved: print final wrap-up and end.

---

## Rules

- **One feature per invocation.** Multiple features → multiple invocations.
- **SRD before MODULES.md.** Only fall back to MODULES.md for modules listed under "Unmigrated" in `docs/SRD.md`.
- **No production code.** Throwaway previews only. Real implementation lives in `/feature-implementation`.
- **Phases extend, they do not rewrite.** Tablet and mobile phases must not modify prior-approved viewport branches in the file.
- **Respect project tokens.** Semantic colors only, logical RTL utilities only, installed primitives only.
- **No PR, no commit, no push.** Iteration happens on-branch first.
