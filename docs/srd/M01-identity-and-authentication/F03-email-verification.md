# M01-F03 — Email Verification

| | |
|---|---|
| **Lifecycle** | `drafting` |
| **Design** | _pending_ |
| **Last updated** | 2026-07-27 |

## 1. Purpose

A user proves ownership of the optional email they supplied during
[F01 Registration](./F01-registration.md) by clicking a time-limited link
sent to that address. Success flips `EmailConfirmed` to true and unlocks
email as an alternative login channel ([F04 Login](./F04-login.md)).
Phone-only accounts are unaffected — email verification is never blocking.

**F01 does not send this email.** Registration only records the address;
the first verification email is triggered by
[M12 Onboarding](../../MODULES.md#m12-f01--onboarding-wizard), or on demand
via the resend endpoint / the standing prompt in R10. Later address changes
re-run this flow via [F10 Email Add / Change / Remove](./F10-email-add-change-remove.md).

## 2. User stories

| As a | I want to | So that |
|---|---|---|
| User who gave an email at signup | click the link in the verification email | I can log in with email in addition to my phone |
| User who missed or deleted the email | request a resend from the check-inbox screen | I'm not permanently locked out of email login |
| User whose link expired | get a fresh link easily | I don't have to start over |
| Platform | bound token lifetime and resend rate | email delivery cost and abuse surface stay bounded |

## 3. Functional requirements

| ID | Requirement | Status |
|---|---|---|
| R01 | Token is cryptographically random (≥ 32 bytes, URL-safe base64); not derived from user data | Drafting |
| R02 | Token TTL 24 hours from issuance | Drafting |
| R03 | Only one active token per email address at a time; a new resend invalidates the previous token | Drafting |
| R04 | Clicking a valid, unexpired token → `EmailConfirmed=true`, token burnt (single-use) | Drafting |
| R05 | Expired or already-burnt token → distinct `email_token_expired` / `email_token_invalid` error with resend CTA | Drafting |
| R06 | Email already confirmed → idempotent `200` with `alreadyVerified=true`; no side effects | Drafting |
| R07 | Resend rate-limited: 60-second cooldown per email address; daily cap (default 10, configurable) | Drafting |
| R08 | Per-IP rate limit on both verify and resend endpoints (sliding window) | Drafting |
| R09 | Email verification never blocks account access — phone-verified accounts operate fully without it | Drafting |
| R10 | A user holding an unverified email sees a **standing, non-blocking "Verify your email" prompt** in profile/settings with a resend action, shown independently of any trigger. This is the recovery path for an address recorded at [F01](./F01-registration.md) whose owner abandoned [M12](../../MODULES.md#m12-f01--onboarding-wizard) onboarding before the first verification email was ever sent — without it, such an address is unverifiable through any surface | Drafting |

## 4. Non-functional requirements

_Module-wide NFRs apply. Feature-specific overrides:_

| Concern | Requirement |
|---|---|
| Security | Token stored hashed (SHA-256 + pepper); plaintext only in the outbound email. Invalidate all tokens for an email on successful verify. |
| Performance | Token-verify redirect p95 < 200 ms. Resend enqueue p95 < 100 ms (excluding SMTP dispatch). |
| Deliverability | Email from a dedicated sending domain; SPF/DKIM/DMARC configured. |
| i18n | Email body and SPA strings localised `en` + `ur`. |

## 5. Acceptance criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC1 | Valid, unexpired token for an unverified email | `GET /auth/verify-email?token=<t>` | 200, `EmailConfirmed=true`, token burnt, SPA shows "Email verified — sign in to continue" screen (no auto-sign-in; applies whether same or different device) |
| AC2 | Token past 24-hour TTL | Verify | 410 `email_token_expired`; SPA shows "Link expired — resend?" CTA |
| AC3 | Token already burnt (re-click) | Verify | 410 `email_token_invalid`; same "Link expired — resend?" CTA |
| AC4 | Email already verified | Verify (any token) | 200 with `alreadyVerified=true`; no state changes; audit event emitted |
| AC5 | Resend within 60 s of last issuance | `POST /auth/resend-email-verification {email}` | 429 with `Retry-After` header; no new token queued |
| AC6 | Resend, daily cap hit | Resend | 429 `email_daily_cap`; user told to retry tomorrow |
| AC7 | Resend, cooldown elapsed, cap not hit | Resend | 202; new token queued; old active token invalidated; countdown resets on screen |

## 6. Design flow

Design: [`F03-email-verification.tsx`](../../../fuel-flow-web/src/design/screens/M01/F03-email-verification.tsx) · live at `/design/M01/M01-F03`.

**Screens:** Check-inbox (with resend + countdown) → verified success.

**States in the design:** check-inbox default, resend cooldown active. **Pending:** expired-link, invalid-link, daily-cap-reached, already-verified.

## 7. Dependencies

| Relation | Target | Why |
|---|---|---|
| Depends on | [F01 Registration](./F01-registration.md) | Records the optional address at signup — but does **not** send the first verification email (see §1) |
| Depends on | [M12-F01 Onboarding Wizard](../../MODULES.md#m12-f01--onboarding-wizard) | Triggers the first verification email for an address recorded at registration. ⚠️ Unmigrated module — spec lives in the deprecated `MODULES.md` |
| Depends on | [M10-F03 Notification Channels](../../MODULES.md#m10-f03--notification-channels) | SMTP sender for verification emails |
| Used by | [F04 Login](./F04-login.md) | Email login channel requires `EmailConfirmed=true` |
| Used by | [F10 Email Add / Change / Remove](./F10-email-add-change-remove.md) | Re-runs this flow for the new address before swapping |
| Out of scope | Phone OTP verification (→ [F02](./F02-phone-otp-verification.md)) · magic-link login (not planned) | Owned by their respective features |

## 8. Audit emissions

| Event | Fields | Sink |
|---|---|---|
| `auth.email.verification_sent` | `userId, emailHash, ip, purpose` | [M17](../M17-audit-and-compliance/README.md) |
| `auth.email.verified` | `userId, emailHash, ip` | [M17](../M17-audit-and-compliance/README.md) |
| `auth.email.already_verified` | `userId, emailHash, ip` | [M17](../M17-audit-and-compliance/README.md) |
| `auth.email.verification_failed` | `userId?, emailHash, ip, outcome` | [M17](../M17-audit-and-compliance/README.md) |
| `auth.email.resend_rate_limited` | `userId?, emailHash, ip, reason` | [M17](../M17-audit-and-compliance/README.md) |

`purpose` ∈ `{registration, email-change}`. `outcome` ∈ `{expired, invalid}`. `reason` ∈ `{cooldown, daily_cap, ip_window}`.

## 9. API surface

| Method | Path | Body / Params | Responses |
|---|---|---|---|
| `GET` | `/api/v1/auth/verify-email` | `?token=<string>` | 200 · 410 (`email_token_expired` / `email_token_invalid`) · 429 |
| `POST` | `/api/v1/auth/resend-email-verification` | `{email}` | 202 · 429 (`cooldown` / `email_daily_cap`) |

Full schemas in Swagger. Side effect on resend: enqueues email via M10-F03.

## 10. Open questions

_None._ All initial open questions resolved 2026-06-27 — see section 11.

## 11. Change history

- **2026-06-27** — Initial draft.
- **2026-06-27** — **OQ1 resolved →** always show "verified — sign in" screen; no auto-sign-in. Keeps server logic stateless (no session detection); matches the cross-device case naturally. AC1 updated.
- **2026-06-27** — **OQ2 resolved →** same as OQ1 decision — verify succeeds, SPA shows success + login CTA regardless of device. No separate handling needed.
- **2026-06-27** — **OQ3 resolved →** no security-notification email. User just clicked the link themselves; a second email is noise with no meaningful security gain.
- **2026-07-27** — **First-email trigger moved from F01 to M12.** §1 and §7 both asserted that F01 queues the first verification email; F01's own R07/AC1 never did, so the two specs disagreed. Resolved in F01's favour: registration records the address only, M12 onboarding sends the first email. Surfaced during `/plan-feature M01-F01`. Note the new §7 dependency on M12 — an unmigrated module still specced in the deprecated `MODULES.md`.
- **2026-07-27** — **R10 added (new).** Moving the trigger to M12 opened a gap symmetrical to [F01 R11](./F01-registration.md): an address recorded at signup by a user who then abandons onboarding would never be sent a verification email, and nothing routed them to the resend endpoint. R10 makes the "Verify your email" prompt standing and trigger-independent, so the address is always recoverable.
- **2026-07-27** — **Broken links fixed** — `./F10-email-change.md` (×2, §1 and §7) → `./F10-email-add-change-remove.md`. **Design link corrected** from a `src/design/screens/M01/` path that never existed on disk to `_pending_`.
