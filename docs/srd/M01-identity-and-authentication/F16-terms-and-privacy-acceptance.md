# M01-F16 — Terms & Privacy Acceptance

| | |
|---|---|
| **Lifecycle** | `drafting` |
| **Design** | _pending_ |
| **Last updated** | 2026-06-28 |

## 1. Purpose

Records that a user has accepted the **current** version of Fuel Flow's Terms
of Service and Privacy Policy, and forces re-acceptance when either is
updated. Acceptance is captured at [F01 Registration](./F01-registration.md)
and re-prompted via a blocking modal on the next login ([F04](./F04-login.md))
after a version bump. Versions are immutable and the prompt cannot be skipped —
this is the compliance-of-record trail.

## 2. User stories

| As a | I want to | So that |
|---|---|---|
| New user | accept T&C and Privacy at signup | I know what I'm agreeing to |
| Existing user | be prompted again when terms materially change | the platform stays in good legal standing |
| Legal | retrieve the exact version a user accepted, when, from where | we can answer regulator / audit queries |
| Platform | block the app on un-accepted current version | the legal posture is enforced, not optional |

## 3. Functional requirements

| ID | Requirement | Status |
|---|---|---|
| R01 | T&C and Privacy each have a **`Document`** record with `{id, kind, version, effectiveAt, contentHtml, contentMd, sha256}`; `kind ∈ {tos, privacy}`; versions are immutable once `effectiveAt <= now()` | Drafting |
| R02 | A **`UserAcceptance`** row records `{userId, documentId, acceptedAt, ip, ua}` — one row per user per (kind, version); never updated, only inserted | Drafting |
| R03 | `GET /legal/current` returns the current effective version of both kinds (`{tos: {version, effectiveAt, url}, privacy: {…}}`) | Drafting |
| R04 | `GET /legal/{kind}/{version}` returns the full document (html + sha256) — used by the SPA viewer and by the audit trail | Drafting |
| R05 | At registration ([F01](./F01-registration.md)), the user must tick a single checkbox covering both kinds; stamp **both** acceptances atomically with the registration row | Drafting |
| R06 | On any authenticated request, if the user lacks acceptance for the current version of *either* kind, the SPA receives `tcAcceptanceRequired=true` in the auth payload and shows a blocking modal that lists both kinds; user accepts (one tick covers both) → `POST /legal/accept {tos: version, privacy: version}` records the rows | Drafting |
| R07 | The blocking modal cannot be dismissed; the only escape is acceptance or sign-out | Drafting |
| R08 | Re-acceptance after a version bump is **not** a security event — no session revocation, no notifications | Drafting |
| R09 | Document publishing is **out of M01 scope** — versions are seeded via DB migration / deployment artefact; an admin UI to publish is owned by [M16](../M16-team-and-access/README.md) or a future ops surface | Drafting |
| R10 | All historical acceptances retained forever (per [M01 AUD-005 / M17](../M17-audit-and-compliance/README.md)); never deleted, only superseded | Drafting |

## 4. Non-functional requirements

| Concern | Requirement |
|---|---|
| Immutability | Once `effectiveAt` has passed, `Document.contentHtml` and `sha256` are read-only — enforced at the DB layer (trigger / column update guard). Updates require a new version row. |
| Performance | `GET /legal/current` p95 < 50 ms (cached); `POST /legal/accept` p95 < 100 ms (single insert × 2). |
| Storage | `contentHtml` ≤ 200 KB per version (reasonable for legal text). |
| Privacy | Acceptance row stores ip + ua for legal traceability; honour M17 retention. |
| i18n | Document body localised `en` + `ur`; each (kind, version, locale) is its own `Document` row or has a sibling translation row sharing the version key |

## 5. Acceptance criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC1 | New registration | F01 submit | Two `UserAcceptance` rows (tos, privacy) inserted atomically with the user row; stamped versions match `GET /legal/current` |
| AC2 | User has accepted current versions | Any authenticated request | `tcAcceptanceRequired=false` in auth payload; no modal |
| AC3 | TOS version bumped overnight | User's next login or refresh | `tcAcceptanceRequired=true`; SPA shows blocking modal listing both kinds with the *new* TOS flagged "Updated" |
| AC4 | User accepts the prompt | `POST /legal/accept` | 200; new `UserAcceptance` rows; subsequent requests show `tcAcceptanceRequired=false` |
| AC5 | User attempts to bypass the modal (direct API call) | Any non-`legal/*` endpoint | 403 `tc_acceptance_required` (or equivalent middleware gate) |
| AC6 | Legal asks "what did user X accept on date Y" | `GET /admin/legal/acceptances?userId=X` | 200 with timeline of (kind, version, acceptedAt, ip, ua) |
| AC7 | Attempt to update an already-effective Document row | Direct DB update | Trigger rejects; service responds 409 `document_immutable` if attempted via API |
| AC8 | Document version published in the future | `GET /legal/current` before `effectiveAt` | Returns previous version, not the future one |

## 6. Design flow

Design: _pending_.

**Surfaces:** Signup form checkbox + linked viewers. Blocking modal at login with diff-style "What changed" summary (manually curated per version), full-document viewer, scroll-to-end requirement before the Accept button enables. Footer link → standalone viewer anytime.

## 7. Dependencies

| Relation | Target | Why |
|---|---|---|
| Used by | [F01 Registration](./F01-registration.md) | Stamp at signup |
| Used by | [F04 Login](./F04-login.md) | `tcAcceptanceRequired` flag in payload |
| Used by | [M17 Audit](../M17-audit-and-compliance/README.md) | Retention + retrieval |
| Configured by | [M16 Team & Access](../M16-team-and-access/README.md) | Future publishing UI |
| Out of scope | Publishing UI, legal authoring workflow, e-signature integration | Future / external |

## 8. Audit emissions

| Event | Fields | Sink |
|---|---|---|
| `legal.document.published` | `documentId, kind, version, effectiveAt, sha256, publishedBy` | [M17](../M17-audit-and-compliance/README.md) |
| `legal.acceptance.recorded` | `userId, documentId, kind, version, acceptedAt, ip, ua, source` | M17 |
| `legal.acceptance.prompted` | `userId, missingKinds[]` | M17 |
| `legal.acceptance.bypass_attempted` | `userId, path, ip` | M17 |

`source` ∈ `{registration, post_login_modal}`. `missingKinds ⊆ {tos, privacy}`.

## 9. API surface

| Method | Path | Body / Params | Responses |
|---|---|---|---|
| `GET` | `/api/v1/legal/current` | _none_ | 200 (`{tos: {version, effectiveAt, url}, privacy: {…}}`) |
| `GET` | `/api/v1/legal/{kind}/{version}` | _path_ | 200 · 404 |
| `POST` | `/api/v1/legal/accept` | `{tos: version, privacy: version}` | 200 · 400 (`version_mismatch`) · 409 |

Full schemas in Swagger. The middleware that returns `tcAcceptanceRequired=true` on un-accepted state is referenced from [F04 R13](./F04-login.md).

## 10. Open questions

- **OQ1** — Do we treat **material vs. cosmetic** updates differently (only material bumps re-prompt)? Currently any version bump re-prompts; flagging "minor" updates is a publishing-workflow concern best deferred to the future publishing UI.
- **OQ2** — Should we capture the user's **chosen locale** (`en` vs. `ur`) on the acceptance row? Useful in legal disputes where the localised text matters. Leaning yes.
- **OQ3** — "Scroll-to-end before Accept" gate — friction for legitimate users, weak deterrent against not reading. Keep, drop, or replace with a checkbox affirmation? Leaning drop the scroll gate, keep the linked viewer.

## 11. Change history

- **2026-06-28** — Initial draft.
