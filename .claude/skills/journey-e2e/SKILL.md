---
name: journey-e2e
description: Plan and generate a Playwright end-to-end test that walks a cross-feature user journey — the flow that spans multiple SRD features (e.g. register → verify phone → onboard → dashboard). Complements `/feature-e2e-testing` (which covers ONE feature) by catching integration bugs at feature boundaries where most real-user bugs live. Produces `docs/e2e-journeys/<journey-name>.md` (the journey plan) and `fuel-flow-web/e2e-tests/journeys/<journey-name>.spec.ts` (the passing Playwright spec). Use when you notice a real-user flow spans multiple features and needs one connected walkthrough.
---

# /journey-e2e — cross-feature user-journey test

`/feature-e2e-testing` walks one feature's acceptance criteria in isolation. But most bugs live at *feature boundaries* — where the register form hands off to phone-OTP, where OTP hands off to onboarding, where onboarding hands off to the dashboard. Those flows are only exercised end-to-end when a real user runs the whole thing.

This skill produces a Playwright spec that walks the whole flow, catching integration issues that per-feature E2E misses:

- Data / cookie handoff between features (session, org, station context)
- Route-guard interactions (M01 → M12 onboarding → M07-F06 dashboard)
- Copy consistency (does the OTP screen's back-nav actually go where the register screen said it would?)
- Timing / rate limit interactions (does M01-F01 register followed by M01-F02 resend hit the daily OTP cap in an unexpected way?)

## When to use

- **Whenever a real-world flow spans ≥2 shipped features** and the boundary is user-visible. Common candidates:
  - Owner sign-up: register → phone OTP → email verify → onboarding → dashboard
  - New station: dashboard → add station → configure tanks → set prices → open first shift
  - Credit customer lifecycle: create customer → set credit limit → post credit sale → collect payment
- **After the last feature in the chain ships** — earlier features must be on `main`.
- **Not for single-feature flows** — those go through `/feature-e2e-testing`.

## Workflow

### Phase A — Name and scope the journey

1. Ask the user for the journey name (kebab-case, e.g. `owner-first-signup`).
2. Ask which features it spans, in order. Auto-suggest based on plan.md's cross-feature dependencies if a feature ID is given as a starting point.
3. Validate: every named feature must be `shipped` (or `in-implementation` with the last commit on main). Cannot journey through a feature that isn't real yet.
4. Read every feature's `plan.md` (the User journey diagram in each is authoritative for that segment).

### Phase B — Draft the journey plan

Produce `docs/e2e-journeys/<journey-name>.md` with:

- **Journey name + one-line purpose**
- **Features spanned** — list with IDs and their `plan.md` refs
- **Ordered steps** — each step is a screen-level action ("Fill register form", "Submit", "Enter OTP", …). Each step names the feature it belongs to.
- **Handoff points** — the exact URL / cookie / session state at each feature boundary. This is where integration bugs surface.
- **Assertions along the way** — one per step. Not every AC of every feature — just enough to prove the journey happened.
- **Test data strategy** — reused phone numbers (per-test hash), throwaway emails, cleanup steps.
- **Failure branches** (optional) — the "what if the OTP expires mid-journey?" variant, as separate `test.describe` blocks.

Present the plan for approval before generating the spec.

### Phase C — Generate the Playwright spec

Write `fuel-flow-web/e2e-tests/journeys/<journey-name>.spec.ts` following the project's existing E2E conventions (search `fuel-flow-web/e2e-tests/*.spec.ts` for style). Key patterns:

- Import shared helpers from `fuel-flow-web/e2e-tests/_helpers/*.ts` (create if missing).
- Use `test.describe.serial` for the journey — steps depend on each other.
- Each step is one `test.step()` call so the Playwright report shows the whole flow.
- Assertions per step: URL, key visible content, cookies, one behaviour proof (e.g. "toast success visible").
- End with a cleanup step (delete test org / user) so re-runs are hermetic.

### Phase D — Run + fix

1. Run the spec: `cd fuel-flow-web && npx playwright test e2e-tests/journeys/<journey-name>.spec.ts`.
2. If it fails at a specific feature boundary, that's a real integration bug. Fix it in the responsible feature's code (not in the journey spec).
3. If a per-feature `/feature-e2e-testing` spec already covers the segment correctly but the journey spec fails, that's a strong signal the per-feature spec is over-mocked or the seams are wrong.
4. Loop until the journey passes end-to-end without stubs.

### Phase E — Wire into CI

Add to `.github/workflows/*.yml` (or wherever Playwright runs in CI) as a separate job labelled `journey`. Journey tests take longer than per-feature tests (5–10 min vs 30s), so run them on `push to main` and `nightly`, not on every PR.

## `journey.md` structure

```markdown
---
name: owner-first-signup
purpose: Take a fresh owner from landing → registered → phone-verified → onboarded → dashboard.
features: [M01-F01, M01-F02, M01-F03, M12-F01]
spec: fuel-flow-web/e2e-tests/journeys/owner-first-signup.spec.ts
last_updated: YYYY-MM-DD
---

# Journey: owner-first-signup

## Features spanned
| Order | Feature | Plan |
|---|---|---|
| 1 | M01-F01 Registration | [plan](../implementation/M01-F01/plan.md) |
| 2 | M01-F02 Phone OTP | [plan](../implementation/M01-F02/plan.md) |
| 3 | M01-F03 Email verify | [plan](../implementation/M01-F03/plan.md) |
| 4 | M12-F01 Onboarding | [plan](../implementation/M12-F01/plan.md) |

## Steps
| # | Step | Feature | Assertion |
|---|---|---|---|
| 1 | Load /auth/register | M01-F01 | 200; brand panel visible |
| 2 | Fill form with unique phone + email | M01-F01 | fields accept |
| 3 | Submit; expect redirect to /auth/verify-phone | M01-F01 → M01-F02 | url = /auth/verify-phone?phone=… |
| 4 | Read OTP from Sms:Provider=console log | M01-F02 (test seam) | otp is 6 digits |
| … | | | |

## Handoff points
| From → To | Carried state |
|---|---|
| M01-F01 → M01-F02 | `phone` query param + `verify_pending_id` cookie |
| M01-F02 → M12-F01 | session cookie set on OTP success |

## Test data strategy
- Phone: `+92300<hash-of-test-name-mod-10000000>` — deterministic + reusable
- Email: `journey-<hash>@example.pk`
- Cleanup: `DELETE /test/tenant?email=<email>` (existing test-only endpoint)

## Failure branches
- **OTP-expires-mid-flow**: wait 5m past OTP validity, expect resend flow.
- **email-verify-skipped**: assert dashboard blocks Owner-restricted actions until verified.
```

## Contract with the pipeline

- **Runs after** every spanned feature ships. Cannot start with unshipped features.
- **Discovers integration bugs** that per-feature E2E misses — fix in the feature's code, not in the journey.
- **Failure signals a spec gap** in one of the plan.md files — either the handoff wasn't spec'd, or one feature's plan lies about the handoff state.
- **Journeys accumulate.** By 10 shipped features you should have 3–5 journeys. Not every feature-pair combination — just the flows real users actually take.

## Cost note

Planning: ~10–15k tokens (read all spanned features' plans).
Generation: ~15–25k tokens (Playwright spec + helpers).
Runtime: 5–10 minutes per journey (real browser, no mocks).

## Rules

- **One journey per invocation.**
- **Every step maps to exactly one feature.** No "meta" steps that no feature owns.
- **No stubbing across features.** Journey specs must run against real code end-to-end. If you need a stub, the seam is wrong.
- **Cleanup is mandatory.** Journey specs run repeatedly; test data must not accumulate.
- **Journey plan is durable.** Unlike plan.md (disposable after ship), journey.md stays as a living contract for the flow.
