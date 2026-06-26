# Fuel Flow — Software Requirements Document

> **Status:** Draft · transitioning from [`MODULES.md`](MODULES.md). During the
> transition both files are sources of truth — read both, write to the SRD for
> any *new* feature or restructure. See [`srd/README.md`](srd/README.md) for the
> conventions every feature file must follow.

The SRD is a hierarchical, per-feature-flow document. Each feature has its own
file, references its design flow in the `/design` playground, and tracks status,
acceptance criteria, dependencies, audit emissions, and open questions.

## Module index

| ID | Title | Status | Location |
|---|---|---|---|
| M01 | Authentication | Drafting | [`srd/M01-authentication/`](srd/M01-authentication/) |
| M02 | Fuel Inventory & Tank Control | Not migrated | _still in MODULES.md_ |
| M03 | Pump & Nozzle Operations | Not migrated | _still in MODULES.md_ |
| M04 | Shift Management | Not migrated | _still in MODULES.md_ |
| M05 | Finance & Accounts | Not migrated | _still in MODULES.md_ |
| M06 | Pricing & Rate Management | Not migrated | _still in MODULES.md_ |
| M07 | Reporting, Analytics & Platform UI | Not migrated | _still in MODULES.md_ |
| M08 | Settings & Configuration | Not migrated | _still in MODULES.md_ |
| M09 | Lubricants / Oil Shop | Not migrated | _still in MODULES.md_ |
| M10 | SMS / Notifications | Not migrated | _still in MODULES.md_ |
| M11 | Subscription & Billing | Not migrated | _still in MODULES.md_ |
| M12 | Onboarding & First-Run Experience | Not migrated | _still in MODULES.md_ |
| M13 | Staff & Payroll | Not migrated | _still in MODULES.md_ |
| M14 | Per-Tenant Database Architecture | Not migrated | _still in MODULES.md_ |
| M15 | Credit Customer Management | Not migrated | _still in MODULES.md_ |
| M16 | Team & Access Management | Stub | [`srd/M16-team-and-access/`](srd/M16-team-and-access/) |
| M17 | Audit & Compliance | Stub | [`srd/M17-audit-and-compliance/`](srd/M17-audit-and-compliance/) |

## Status legend

| Status | Meaning |
|---|---|
| `Drafting` | Module spec is being written; feature shapes still negotiable |
| `Planned` | Spec is locked, implementation hasn't started |
| `In Progress` | At least one feature is mid-implementation |
| `Done` | Every in-scope feature is shipped |
| `Stub` | Module ID reserved but content not written yet |
| `Not migrated` | Source of truth is still [`MODULES.md`](MODULES.md) until migrated |

## Transition rules

- **New features** start as SRD files. Don't add new rows to `MODULES.md`.
- **In-flight work** finishes against whatever document started it.
- **Migrated modules** flip their MODULES.md sections to `→ moved to SRD/<path>`
  with a link, in the same PR that adds the SRD content.
- **Cutover** happens when every `In Progress` / `Planned` / `Done` row in
  `MODULES.md` has a counterpart in the SRD. Then `MODULES.md` becomes an
  archived appendix and the root [`CLAUDE.md`](../CLAUDE.md) "single source of
  truth" pointer flips to `SRD.md`.
