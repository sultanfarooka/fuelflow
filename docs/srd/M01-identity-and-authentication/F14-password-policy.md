# M01-F14 — Password Policy

| | |
|---|---|
| **Lifecycle** | `drafting` |
| **Design** | _pending_ |
| **Last updated** | 2026-06-28 |

## 1. Purpose

A **single source of truth** for what makes a password acceptable across every
M01 surface that takes one: [F01 Registration](./F01-registration.md),
[F06 Password Recovery](./F06-password-recovery.md), and [F11 Password Change](./F11-password-change.md).
The policy is shared between frontend Zod and backend FluentValidation so a
weak password is rejected identically in both layers (per project root rule
"Always validate input at both frontend and backend").

The default policy is intentionally **modest** for the Pakistani SMB context —
"strong enough that bcrypt + lockout do most of the work" — while leaving
room for a stricter org-level override in [M16](../M16-team-and-access/README.md).

## 2. User stories

| As a | I want to | So that |
|---|---|---|
| New user | see what's required as I type | I don't get rejected on submit |
| User picking a password | get a real-time strength meter | I make an informed choice |
| User picking a weak common password (`password123`) | be blocked even if it passes character rules | the obvious guesses don't get in |
| Owner with stricter security needs | tighten the policy for my org | my team meets my standards |

## 3. Functional requirements

| ID | Requirement | Status |
|---|---|---|
| R01 | **Default policy**: length ≥ 6, must contain ≥ 1 digit (folds in current [F01](./F01-registration.md) rule for back-compat with existing users) | Drafting |
| R02 | **Recommended policy** (off by default; org-toggleable): length ≥ 10, ≥ 1 uppercase, ≥ 1 lowercase, ≥ 1 digit | Drafting |
| R03 | **Always-on bans** (regardless of profile): top-10k common-password list (bundled, `Pwned-style` short-hash check, no network call), exact phone, exact email, `firstName`, `lastName`, `Fuel Flow`, `fuelflow` (case-insensitive substring match) | Drafting |
| R04 | Max length 128 chars to prevent bcrypt DoS via huge input | Drafting |
| R05 | Allowed character set: any printable Unicode (no character class is *required* by default beyond R01); whitespace allowed except leading/trailing | Drafting |
| R06 | Policy exposed via `GET /auth/password-policy` returning the active rules so the SPA strength meter + helper text stay in sync without redeploy | Drafting |
| R07 | Server-side validator returns **all** failed rules in one response, not just the first, so the user can fix in one pass | Drafting |
| R08 | Org-level override toggle (`PasswordProfile ∈ {default, recommended}`) lives in [M16](../M16-team-and-access/README.md) settings; new and changed passwords must pass the **current** profile | Drafting |
| R09 | Existing passwords are **never** re-checked on login — even if the profile tightens, legacy passwords are honoured until next change (UX over churn) | Drafting |
| R10 | **No password history** in M01 (no "cannot reuse last N"). Tracked as a future feature; out of scope here | Drafting |
| R11 | **No mandatory rotation** (no "must change every N days"). Industry guidance is rotation-on-event, not rotation-on-clock | Drafting |

## 4. Non-functional requirements

| Concern | Requirement |
|---|---|
| Consistency | Frontend Zod schema + backend FluentValidator both consume the same rule descriptor (shared JSON or codegen). Drift = bug. |
| Performance | Validation < 5 ms (sync rule scan + O(log n) banned-word lookup). |
| Privacy | Password never logged, even truncated. Banned-list lookup is local; no network call. |
| Storage | Banned list is a Bloom filter of ~10k hashed entries (≤ 100 KB) for cheap "definitely-not / probably-banned" → exact check on probable hits. |
| Observability | Failed-validation outcomes (which rule fired) logged for tuning; **never** the candidate password itself. |

## 5. Acceptance criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC1 | Profile=default, `password=hello1` | Validate | OK (length 6, has digit) |
| AC2 | Profile=default, `password=hello` | Validate | 400 with `[password_no_digit]` |
| AC3 | Profile=default, `password=12345` | Validate | 400 with `[password_too_short]` |
| AC4 | Any profile, `password=password1` | Validate | 400 with `[password_common]` |
| AC5 | Any profile, password contains `firstName` (case-insensitive) | Validate | 400 with `[password_contains_personal]` |
| AC6 | Profile=recommended, `password=Hello1234` | Validate | OK |
| AC7 | Profile=recommended, `password=hello1234` | Validate | 400 with `[password_no_upper]` (and only that — lower + digit + length all pass) |
| AC8 | Multiple rules fail | Validate | 400 with **array** of error codes, not just first |
| AC9 | SPA fetches `/auth/password-policy` | GET | 200 with `{profile, minLength, requireDigit, requireUpper, requireLower, bannedPersonal: [...]}` |
| AC10 | Password length > 128 | Validate | 400 with `[password_too_long]` |

## 6. Design flow

Design: _pending_.

**Component:** `<PasswordField>` with live strength meter (Very weak / Weak / OK / Strong) and inline rule checklist. The meter is opinion (zxcvbn-style heuristic, client-only); the rules are policy. Same component used in F01, F06, F11.

## 7. Dependencies

| Relation | Target | Why |
|---|---|---|
| Used by | [F01 Registration](./F01-registration.md) | New-password validation |
| Used by | [F06 Password Recovery](./F06-password-recovery.md) | New-password validation |
| Used by | [F11 Password Change](./F11-password-change.md) | New-password validation |
| Configured by | [M16 Team & Access](../M16-team-and-access/README.md) | Org-level profile toggle |
| Out of scope | Password history, mandatory rotation | Future features |

## 8. Audit emissions

| Event | Fields | Sink |
|---|---|---|
| `auth.password.policy_violation` | `userId?, surface, failedRules` | [M17](../M17-audit-and-compliance/README.md) |
| `auth.password.policy_profile_changed` | `orgId, actorUserId, oldProfile, newProfile` | M17 |

`surface` ∈ `{registration, recovery, change}`. `failedRules ⊆ {too_short, too_long, no_digit, no_upper, no_lower, common, contains_personal}`.

## 9. API surface

| Method | Path | Body | Responses |
|---|---|---|---|
| `GET` | `/api/v1/auth/password-policy` | _none_ | 200 |

Validation itself is **not** a public endpoint — it runs inline in F01 / F06 / F11.
Full schemas in Swagger.

## 10. Open questions

- **OQ1** — Should the default profile bump to `length ≥ 8` for new accounts, keeping length ≥ 6 only for existing legacy logins? Trade-off: better baseline vs. friction for low-tech users.
- **OQ2** — Banned-list shipping: bundle as Bloom filter (current plan, ~100 KB) or fetch lazily on demand? Bundling avoids a cold-start hit but tracks the binary; revisit if list grows.

## 11. Change history

- **2026-06-28** — Initial draft.
