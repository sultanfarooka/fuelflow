---
id: M17
title: Audit & Compliance
lifecycle: drafting
last-updated: 2026-06-27
---

# M17 — Audit & Compliance

> **Stub.** Module ID reserved. Feature shapes haven't been written yet.

## Purpose

The platform-wide, immutable record of **who did what, when, and what changed**.
Every feature in every other module emits structured audit events into M17; M17
owns the sink, the retention policy, the viewer UI, and the exports.

## Provisional feature list

| ID | Feature | Source |
|---|---|---|
| M17-F01 | Audit Event Schema & Emission Contract | New (cross-cutting) |
| M17-F02 | Append-Only Sink & Retention | From M01-F08 in MODULES.md |
| M17-F03 | Audit Viewer UI (Owner-only) | From M01-F08-R06 in MODULES.md |
| M17-F04 | Export (CSV / JSON) | New |
| M17-F05 | Anomaly Highlights | New (optional) |

## Scope (provisional)

**In scope**
- The append-only event schema and emission contract that every other module follows
- Storage: append-only table, never deleted, retention configurable per Owner
- Filterable Owner-only viewer (user, entity, action, date range)
- Export for accountant / regulator handover
- Anomaly highlights — flagged rows (e.g. price change outside business hours)

**Out of scope**
- Authentication audit emissions are designed *in* the M01 features and *consumed* here.
  M17 does not redesign them.
- Real-time SIEM streaming — v1 stays inside Fuel Flow's DB.
- Cross-organisation aggregated reporting.

## Dependencies

- **Hard:** [M01 Authentication](../M01-authentication/README.md) — every feature in M01 lists its audit emissions in section 8 of its file; M17-F01 codifies the contract.
- **Hard:** [M16 Team & Access Management](../M16-team-and-access/README.md) — same contract.
- **Soft:** Every other module emits into M17.

## Cross-module audit emissions catalogue (to be assembled)

Once M17-F01 is drafted, this README will gain a table aggregating every
`section 8 — Audit emissions` row from every other feature in the SRD, so the
event vocabulary lives in one place.

## Next steps

Draft F01 first — the schema and emission contract is the load-bearing piece;
F02–F05 are downstream of it.
