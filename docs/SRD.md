# Fuel Flow — Software Requirements Document

> **Draft** · transitioning from [`MODULES.md`](MODULES.md). Both are sources of
> truth during transition. **Write new features into the SRD.** Conventions:
> [`srd/README.md`](srd/README.md).

Per-feature-flow document. Each feature has its own file with sections for
purpose, requirements, NFRs, acceptance criteria, design-flow link, dependencies,
audit emissions, API surface, open questions, and change history.

## Module index

| ID | Title | Lifecycle | Location |
|---|---|---|---|
| M01 | Authentication | `drafting` | [`srd/M01-authentication/`](srd/M01-authentication/) |
| M02 | Fuel Inventory & Tank Control | _MODULES.md_ | _unmigrated_ |
| M03 | Pump & Nozzle Operations | _MODULES.md_ | _unmigrated_ |
| M04 | Shift Management | _MODULES.md_ | _unmigrated_ |
| M05 | Finance & Accounts | _MODULES.md_ | _unmigrated_ |
| M06 | Pricing & Rate Management | _MODULES.md_ | _unmigrated_ |
| M07 | Reporting, Analytics & Platform UI | _MODULES.md_ | _unmigrated_ |
| M08 | Settings & Configuration | _MODULES.md_ | _unmigrated_ |
| M09 | Lubricants / Oil Shop | _MODULES.md_ | _unmigrated_ |
| M10 | SMS / Notifications | _MODULES.md_ | _unmigrated_ |
| M11 | Subscription & Billing | _MODULES.md_ | _unmigrated_ |
| M12 | Onboarding & First-Run Experience | _MODULES.md_ | _unmigrated_ |
| M13 | Staff & Payroll | _MODULES.md_ | _unmigrated_ |
| M14 | Per-Tenant Database Architecture | _MODULES.md_ | _unmigrated_ |
| M15 | Credit Customer Management | _MODULES.md_ | _unmigrated_ |
| M16 | Team & Access Management | `drafting` | [`srd/M16-team-and-access/`](srd/M16-team-and-access/) |
| M17 | Audit & Compliance | `drafting` | [`srd/M17-audit-and-compliance/`](srd/M17-audit-and-compliance/) |

## Module lifecycle legend

Same vocabulary as the per-feature lifecycle ([`srd/README.md`](srd/README.md)), summarising every feature inside.

| State | Meaning at module level |
|---|---|
| `drafting` | ≥ 1 feature still `drafting` |
| `spec-locked` | All features `spec-locked` or later |
| `design-approved` | All features have an approved design playground file |
| `in-implementation` | ≥ 1 feature `in-implementation`, none below `design-approved` |
| `shipped` | All in-scope features `shipped` |
| _MODULES.md_ | Not migrated yet — see [`MODULES.md`](MODULES.md) |

## Transition rules

| Case | Rule |
|---|---|
| New feature | Write to SRD only. Don't add MODULES.md rows. |
| In-flight work | Finish against whichever document started it. |
| Migrating a module | Replace the MODULES.md section with `→ moved to <SRD path>` in the same PR. |
| Cutover | When every `In Progress` / `Planned` / `Done` MODULES.md row has an SRD counterpart, MODULES.md becomes an archive and root [`CLAUDE.md`](../CLAUDE.md) Rule 1 flips its pointer to the SRD. |
