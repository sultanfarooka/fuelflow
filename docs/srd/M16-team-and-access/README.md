---
id: M16
title: Team & Access Management
lifecycle: drafting
last-updated: 2026-06-27
---

# M16 — Team & Access Management

> **Stub.** Module ID reserved. Feature files haven't been written yet.

People-administration **inside** an organisation — once they've authenticated
via [M01](../M01-identity-and-authentication/README.md). Invite, role assignment,
granular permissions, multi-station scoping, edit / deactivate, owner-initiated
password resets.

## Scope

| In scope | Out of scope (lives in) |
|---|---|
| Invite Manager / Custom Users | Authentication, credentials — [M01](../M01-identity-and-authentication/README.md) |
| Owner / Manager / Custom role assignment | Cross-org user mobility |
| Per-module granular permissions | Seat enforcement — [M11](../../MODULES.md#m11--subscription--billing) |
| Multi-station access assignment | Audit-log emission consumers — [M17](../M17-audit-and-compliance/README.md) |
| Edit / deactivate / reactivate members | |
| Owner-initiated password reset on others | |
| Team directory & search | |

## Dependencies

| Strength | Target | Why |
|---|---|---|
| Hard | [M01 Identity & Authentication](../M01-identity-and-authentication/README.md) | Members must authenticate first |
| Hard | [M11 Subscription & Billing](../../MODULES.md#m11--subscription--billing) | Seat limits gate invites |
| Soft | [M17 Audit & Compliance](../M17-audit-and-compliance/README.md) | Every team-mgmt action is auditable |

## Provisional feature list

F-IDs finalised when the module is drafted.

| ID | Feature | Source |
|---|---|---|
| [M16-F01](./F01-invite-user.md) | Invite User (Manager / Custom) | new |
| [M16-F02](./F02-roles-and-hierarchy.md) | Roles & Hierarchy | from M01-F05 in MODULES.md |
| [M16-F03](./F03-granular-permissions-matrix.md) | Granular Permissions Matrix | from M01-F06 |
| [M16-F04](./F04-multi-station-access-assignment.md) | Multi-Station Access Assignment | from M01-F07 |
| [M16-F05](./F05-edit-deactivate-reactivate-member.md) | Edit / Deactivate / Reactivate Member | new |
| [M16-F06](./F06-owner-initiated-password-reset.md) | Owner-Initiated Password Reset | from M01-F04-R03 |
| [M16-F07](./F07-team-directory-and-search.md) | Team Directory & Search | new |
