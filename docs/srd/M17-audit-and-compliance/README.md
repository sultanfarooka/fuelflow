---
id: M17
title: Audit & Compliance
lifecycle: drafting
last-updated: 2026-06-27
---

# M17 — Audit & Compliance

> **Stub.** Module ID reserved. Feature files haven't been written yet.

The platform-wide immutable record of *who did what, when, what changed*.
Every other module emits structured audit events into M17; M17 owns the schema,
the append-only sink, the retention policy, the Owner-only viewer, and the exports.

## Scope

| In scope | Out of scope |
|---|---|
| Audit event schema + emission contract | Real-time SIEM streaming |
| Append-only sink (never deleted; retention configurable per Owner) | Cross-org aggregated reporting |
| Owner-only viewer with filters (user, entity, action, date range) | |
| CSV / JSON export | |
| Anomaly highlights (e.g. price change outside business hours) | |

## Dependencies

| Strength | Target | Why |
|---|---|---|
| Hard | every emitting module | Each feature SRD lists its emissions in §8; M17-F01 codifies the contract |

## Provisional feature list

F-IDs finalised when the module is drafted.

| ID | Feature | Source |
|---|---|---|
| [M17-F01](./F01-audit-event-schema-and-emission-contract.md) | Audit Event Schema & Emission Contract | new (cross-cutting) |
| [M17-F02](./F02-append-only-sink-and-retention.md) | Append-Only Sink & Retention | from M01-F08 in MODULES.md |
| [M17-F03](./F03-audit-viewer-ui.md) | Audit Viewer UI (Owner-only) | from M01-F08-R06 |
| [M17-F04](./F04-export.md) | Export (CSV / JSON) | new |
| [M17-F05](./F05-anomaly-highlights.md) | Anomaly Highlights | new (optional) |
