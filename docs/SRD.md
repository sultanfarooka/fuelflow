# Fuel Flow — Software Requirements Document

> **Status:** Draft · transitioning from [`MODULES.md`](MODULES.md). During the
> transition both files are sources of truth — read both, write to the SRD for
> any *new* feature or restructure. See [`srd/README.md`](srd/README.md) for the
> conventions every feature file must follow.

The SRD is a hierarchical, per-feature-flow document. Each feature has its own
file, references its design flow in the `/design` playground, and tracks status,
acceptance criteria, dependencies, audit emissions, and open questions.

## Module index

The `Lifecycle` column reflects the **module's** lifecycle — a module is
`drafting` while its feature shapes are still negotiable, advances to
`spec-locked` once every feature file has its sections 1–10 frozen, and so on.
See [`srd/README.md`](srd/README.md) for the per-feature lifecycle rules.

| ID | Title | Lifecycle | Location |
|---|---|---|---|
| M01 | Authentication | `drafting` | [`srd/M01-authentication/`](srd/M01-authentication/) |
| M02 | Fuel Inventory & Tank Control | _MODULES.md_ | _still in MODULES.md_ |
| M03 | Pump & Nozzle Operations | _MODULES.md_ | _still in MODULES.md_ |
| M04 | Shift Management | _MODULES.md_ | _still in MODULES.md_ |
| M05 | Finance & Accounts | _MODULES.md_ | _still in MODULES.md_ |
| M06 | Pricing & Rate Management | _MODULES.md_ | _still in MODULES.md_ |
| M07 | Reporting, Analytics & Platform UI | _MODULES.md_ | _still in MODULES.md_ |
| M08 | Settings & Configuration | _MODULES.md_ | _still in MODULES.md_ |
| M09 | Lubricants / Oil Shop | _MODULES.md_ | _still in MODULES.md_ |
| M10 | SMS / Notifications | _MODULES.md_ | _still in MODULES.md_ |
| M11 | Subscription & Billing | _MODULES.md_ | _still in MODULES.md_ |
| M12 | Onboarding & First-Run Experience | _MODULES.md_ | _still in MODULES.md_ |
| M13 | Staff & Payroll | _MODULES.md_ | _still in MODULES.md_ |
| M14 | Per-Tenant Database Architecture | _MODULES.md_ | _still in MODULES.md_ |
| M15 | Credit Customer Management | _MODULES.md_ | _still in MODULES.md_ |
| M16 | Team & Access Management | `drafting` | [`srd/M16-team-and-access/`](srd/M16-team-and-access/) |
| M17 | Audit & Compliance | `drafting` | [`srd/M17-audit-and-compliance/`](srd/M17-audit-and-compliance/) |

## Lifecycle legend

Full per-feature lifecycle rules live in [`srd/README.md`](srd/README.md). At
the module level the same vocabulary applies, summarising every feature inside:

| Lifecycle | Meaning at module level |
|---|---|
| `drafting` | At least one feature in the module is still in `drafting` |
| `spec-locked` | Every feature file is `spec-locked` or later |
| `design-approved` | Every feature has an approved design playground file |
| `in-implementation` | At least one feature is `in-implementation` and none is below `design-approved` |
| `shipped` | Every in-scope feature is `shipped` |
| _MODULES.md_ | Module hasn't been migrated yet; source of truth is [`MODULES.md`](MODULES.md) |

## Transition rules

- **New features** start as SRD files. Don't add new rows to `MODULES.md`.
- **In-flight work** finishes against whatever document started it.
- **Migrated modules** flip their MODULES.md sections to `→ moved to SRD/<path>`
  with a link, in the same PR that adds the SRD content.
- **Cutover** happens when every `In Progress` / `Planned` / `Done` row in
  `MODULES.md` has a counterpart in the SRD. Then `MODULES.md` becomes an
  archived appendix and the root [`CLAUDE.md`](../CLAUDE.md) "single source of
  truth" pointer flips to `SRD.md`.
