---
id: M16
title: Team & Access Management
status: Stub
last-updated: 2026-06-27
---

# M16 — Team & Access Management

> **Stub.** Module ID reserved. Feature shapes haven't been written yet.

## Purpose

Everything an organisation does with its **people** once they've signed up via
[M01 Authentication](../M01-authentication/README.md):

- Invite new members (Managers, Custom Users)
- Assign roles (Owner / Manager / Custom)
- Grant granular per-module permissions to Custom Users
- Assign which stations a member can access (multi-station scoping)
- Edit / deactivate / remove members
- Owner-initiated password reset on other users

Identity, authentication, and account self-service all live in
[M01 Authentication](../M01-authentication/README.md) — this module assumes a
valid authenticated user and concerns itself only with **who that user is
allowed to be inside the organisation**.

## Provisional feature list

These are stubs; the F-IDs will be finalised when the module is drafted.

| ID | Feature | Source |
|---|---|---|
| M16-F01 | Invite User (Manager / Custom) | New |
| M16-F02 | Roles & Hierarchy (Owner / Manager / Custom) | From M01-F05 in MODULES.md |
| M16-F03 | Granular Permissions Matrix | From M01-F06 in MODULES.md |
| M16-F04 | Multi-Station Access Assignment | From M01-F07 in MODULES.md |
| M16-F05 | Edit / Deactivate / Reactivate Member | New |
| M16-F06 | Owner-Initiated Password Reset | From M01-F04-R03 in MODULES.md |
| M16-F07 | Team Directory & Search | New |

## Scope (provisional)

**In scope**
- All membership administration inside one organisation
- All authorization configuration (roles + permissions + station scope)
- Owner-initiated remediation actions on other members

**Out of scope**
- Anything authentication-related (login, password, OTP, etc.) → [M01](../M01-authentication/README.md)
- Audit log of who-did-what — emitted from here, viewed in [M17](../M17-audit-and-compliance/README.md)
- Cross-organisation user mobility (a user with accounts in two orgs)
- Subscription seat enforcement → [M11 Subscription & Billing](../../MODULES.md#m11--subscription--billing)

## Dependencies

- **Hard:** [M01 Authentication](../M01-authentication/README.md) — a member must exist as an authenticated user first.
- **Hard:** [M11 Subscription & Billing](../../MODULES.md#m11--subscription--billing) — seat limits gate invites.
- **Soft:** [M17 Audit & Compliance](../M17-audit-and-compliance/README.md) — every team-management action is auditable.

## Next steps

Draft the F-level files in flow order: invite → roles → permissions → stations → edit → owner reset → directory. Each feature gets its own `FXX-<kebab>.md` per the [SRD conventions](../README.md).
