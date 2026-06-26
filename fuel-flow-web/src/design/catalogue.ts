/**
 * Design playground catalogue — the index of every screen we plan to design.
 *
 * This is the source of truth for the `/design` playground only. It mirrors
 * the feature inventory in `docs/MODULES.md` so we have one screen per
 * `MXX-FXX` feature, but `MODULES.md` remains the authoritative business
 * registry — never set business status from this file.
 *
 * Workflow:
 *   1. When a feature is designed, flip its `designStatus` here.
 *   2. When the design pass reveals a new feature, add a row to
 *      `MODULES.md` (as `Planned`) AND a row here in the same commit.
 *   3. Backend-only or non-UI modules are omitted (e.g. M14).
 */

export type DesignStatus = "todo" | "in-progress" | "in-review" | "approved";

export type ModulesStatus =
  | "Planned"
  | "In Progress"
  | "Done"
  | "Out of Scope";

export interface DesignScreen {
  /** `MXX-FXX` feature identifier — matches `docs/MODULES.md`. */
  featureId: string;
  /** Human-readable feature title. */
  title: string;
  /** Snapshot of MODULES.md status (informational; refresh on demand). */
  modulesStatus: ModulesStatus;
  /** Local design-pass state — drives the playground UI only. */
  designStatus: DesignStatus;
  /**
   * Optional note for cross-cutting / platform features that don't map
   * to a single screen (e.g. PWA, UI Shell). Surfaced as a hint in the UI.
   */
  note?: string;
}

export interface DesignModule {
  /** `MXX` identifier. */
  id: string;
  /** Human-readable module title. */
  title: string;
  /** Short pitch describing what the module covers. */
  summary: string;
  features: DesignScreen[];
}

export const DESIGN_CATALOGUE: DesignModule[] = [
  {
    id: "M01",
    title: "User & Access Management",
    summary:
      "Registration, login, password recovery, roles, permissions, audit trail, phone-first auth.",
    features: [
      { featureId: "M01-F01", title: "Self-Service Registration", modulesStatus: "Done", designStatus: "in-review" },
      { featureId: "M01-F02", title: "Email Verification", modulesStatus: "Done", designStatus: "in-review" },
      { featureId: "M01-F03", title: "Login & Session", modulesStatus: "Done", designStatus: "in-review" },
      { featureId: "M01-F04", title: "Password Recovery", modulesStatus: "Done", designStatus: "in-review" },
      { featureId: "M01-F05", title: "Roles & Hierarchy", modulesStatus: "In Progress", designStatus: "in-review" },
      { featureId: "M01-F06", title: "Granular Permissions", modulesStatus: "Planned", designStatus: "in-review" },
      { featureId: "M01-F07", title: "Multi-Station Access", modulesStatus: "In Progress", designStatus: "in-review" },
      { featureId: "M01-F08", title: "Audit Trail", modulesStatus: "Planned", designStatus: "in-review" },
      { featureId: "M01-F09", title: "Phone-First Authentication", modulesStatus: "Done", designStatus: "in-review" },
    ],
  },
  {
    id: "M02",
    title: "Fuel Inventory & Tank Control",
    summary: "Fuel products, suppliers, underground tanks, dip charts, stock variance, tanker delivery.",
    features: [
      { featureId: "M02-F01", title: "Fuel Products", modulesStatus: "In Progress", designStatus: "todo" },
      { featureId: "M02-F02", title: "Supplier Tracking", modulesStatus: "Planned", designStatus: "todo" },
      { featureId: "M02-F03", title: "Underground Tank Management", modulesStatus: "In Progress", designStatus: "todo" },
      { featureId: "M02-F04", title: "Dip Chart Management", modulesStatus: "Planned", designStatus: "todo" },
      { featureId: "M02-F05", title: "Dip Readings & Stock Variance", modulesStatus: "Planned", designStatus: "todo" },
      { featureId: "M02-F06", title: "Fuel Receiving (Tanker Delivery)", modulesStatus: "Planned", designStatus: "todo" },
    ],
  },
  {
    id: "M03",
    title: "Pump & Nozzle Operations",
    summary: "Nozzle setup, meter reading entry, sales calculation, shortage & excess tracking.",
    features: [
      { featureId: "M03-F01", title: "Nozzle Setup", modulesStatus: "In Progress", designStatus: "todo" },
      { featureId: "M03-F02", title: "Meter Reading Entry", modulesStatus: "Planned", designStatus: "todo" },
      { featureId: "M03-F03", title: "Sales Calculation", modulesStatus: "Planned", designStatus: "todo" },
      { featureId: "M03-F04", title: "Shortage & Excess Tracking", modulesStatus: "Planned", designStatus: "todo" },
    ],
  },
  {
    id: "M04",
    title: "Shift Management",
    summary: "Shift configuration, nozzleman assignment, open/close shift, settlement, cash collection.",
    features: [
      { featureId: "M04-F01", title: "Shift Configuration", modulesStatus: "Planned", designStatus: "todo" },
      { featureId: "M04-F02", title: "Nozzleman Assignment", modulesStatus: "Planned", designStatus: "todo" },
      { featureId: "M04-F03", title: "Open Shift", modulesStatus: "Planned", designStatus: "todo" },
      { featureId: "M04-F04", title: "Close Shift", modulesStatus: "Planned", designStatus: "todo" },
      { featureId: "M04-F05", title: "Sales & Shortage Settlement", modulesStatus: "Planned", designStatus: "todo" },
      { featureId: "M04-F06", title: "Cash Collection", modulesStatus: "Planned", designStatus: "todo" },
    ],
  },
  {
    id: "M05",
    title: "Finance & Accounts",
    summary: "AR, supplier payables, expenses, banks, cash book, invoices, reconciliation, ledger.",
    features: [
      { featureId: "M05-F01", title: "Accounts Receivable (AR) Summary", modulesStatus: "Planned", designStatus: "todo" },
      { featureId: "M05-F02", title: "Supplier Payments (Payables)", modulesStatus: "Planned", designStatus: "todo" },
      { featureId: "M05-F03", title: "Daily Expenses", modulesStatus: "Planned", designStatus: "todo" },
      { featureId: "M05-F04", title: "Bank Accounts", modulesStatus: "Planned", designStatus: "todo" },
      { featureId: "M05-F05", title: "Cash Book & Daily Cash Position", modulesStatus: "Planned", designStatus: "todo" },
      { featureId: "M05-F06", title: "Supplier Invoice & Purchase Bill Entry", modulesStatus: "Planned", designStatus: "todo" },
      { featureId: "M05-F07", title: "Bank Reconciliation", modulesStatus: "Planned", designStatus: "todo" },
      { featureId: "M05-F08", title: "Opening / Migration Balances", modulesStatus: "Planned", designStatus: "todo" },
      { featureId: "M05-F09", title: "Account Head Management", modulesStatus: "In Progress", designStatus: "todo" },
      { featureId: "M05-F10", title: "Other Income Recording", modulesStatus: "Planned", designStatus: "todo" },
      { featureId: "M05-F11", title: "Financial Ledger (Unified Entry Table)", modulesStatus: "Planned", designStatus: "todo" },
    ],
  },
  {
    id: "M06",
    title: "Pricing & Rate Management",
    summary: "Price configuration, change workflow, mid-shift handling, margins, special rates, promotions.",
    features: [
      { featureId: "M06-F01", title: "Price Configuration", modulesStatus: "Done", designStatus: "todo" },
      { featureId: "M06-F02", title: "Price Change Workflow", modulesStatus: "Planned", designStatus: "todo" },
      { featureId: "M06-F03", title: "Mid-Shift Price Handling", modulesStatus: "Planned", designStatus: "todo" },
      { featureId: "M06-F04", title: "Margins & Discounts", modulesStatus: "Planned", designStatus: "todo" },
      { featureId: "M06-F05", title: "Customer Special Rates", modulesStatus: "Planned", designStatus: "todo" },
      { featureId: "M06-F06", title: "Promotional Pricing", modulesStatus: "Planned", designStatus: "todo" },
    ],
  },
  {
    id: "M07",
    title: "Reporting, Analytics & Platform UI",
    summary: "Reports, dashboard widgets, multi-station view, shell, PWA, design system, nav catalog.",
    features: [
      { featureId: "M07-F01", title: "Daily Sales Report", modulesStatus: "Planned", designStatus: "todo" },
      { featureId: "M07-F02", title: "Inventory Reports", modulesStatus: "Planned", designStatus: "todo" },
      { featureId: "M07-F03", title: "Financial Reports", modulesStatus: "Planned", designStatus: "todo" },
      { featureId: "M07-F04", title: "Export & Automation", modulesStatus: "Planned", designStatus: "todo" },
      { featureId: "M07-F05", title: "Dashboard Widgets", modulesStatus: "In Progress", designStatus: "todo" },
      { featureId: "M07-F06", title: "Consolidated All-Stations View", modulesStatus: "In Progress", designStatus: "todo" },
      { featureId: "M07-F07", title: "UI Shell", modulesStatus: "Done", designStatus: "todo", note: "Cross-cutting platform — header, sidebar, station switcher." },
      { featureId: "M07-F08", title: "Progressive Web App (PWA)", modulesStatus: "Done", designStatus: "todo", note: "Cross-cutting platform — offline banner, install behaviour." },
      { featureId: "M07-F09", title: "Design System & Theme Foundation", modulesStatus: "Done", designStatus: "todo", note: "Cross-cutting platform — tokens, type ramp, semantic colours." },
      { featureId: "M07-F10", title: "Complete Navigation Catalog & Placeholders", modulesStatus: "Done", designStatus: "todo" },
    ],
  },
  {
    id: "M08",
    title: "Settings & Configuration",
    summary: "Station profile, tank/nozzle/dip-chart config, fuel types, preferences, backup.",
    features: [
      { featureId: "M08-F01", title: "Station Profile", modulesStatus: "Done", designStatus: "todo" },
      { featureId: "M08-F02", title: "Tank Configuration", modulesStatus: "Done", designStatus: "todo" },
      { featureId: "M08-F03", title: "Nozzle Configuration", modulesStatus: "Done", designStatus: "todo" },
      { featureId: "M08-F04", title: "Dip Chart Management", modulesStatus: "Planned", designStatus: "todo" },
      { featureId: "M08-F05", title: "System Preferences", modulesStatus: "Planned", designStatus: "todo" },
      { featureId: "M08-F06", title: "Backup & Data", modulesStatus: "Planned", designStatus: "todo" },
      { featureId: "M08-F07", title: "Station Configuration", modulesStatus: "Done", designStatus: "todo" },
      { featureId: "M08-F08", title: "Fuel Type Management", modulesStatus: "Done", designStatus: "todo" },
    ],
  },
  {
    id: "M09",
    title: "Lubricants / Oil Shop",
    summary: "Product inventory, lubricant sales, stock management, reporting.",
    features: [
      { featureId: "M09-F01", title: "Product Inventory", modulesStatus: "Planned", designStatus: "todo" },
      { featureId: "M09-F02", title: "Lubricant Sales", modulesStatus: "Planned", designStatus: "todo" },
      { featureId: "M09-F03", title: "Stock Management", modulesStatus: "Planned", designStatus: "todo" },
      { featureId: "M09-F04", title: "Lubricant Reporting", modulesStatus: "Planned", designStatus: "todo" },
    ],
  },
  {
    id: "M10",
    title: "SMS / Notifications",
    summary: "Events, recipients, channels, behaviour, summary reports.",
    features: [
      { featureId: "M10-F01", title: "Notification Events", modulesStatus: "Planned", designStatus: "todo" },
      { featureId: "M10-F02", title: "Recipients & Targeting", modulesStatus: "Planned", designStatus: "todo" },
      { featureId: "M10-F03", title: "Notification Channels", modulesStatus: "Planned", designStatus: "todo" },
      { featureId: "M10-F04", title: "Notification Behavior", modulesStatus: "Planned", designStatus: "todo" },
      { featureId: "M10-F05", title: "Summary Reports", modulesStatus: "Planned", designStatus: "todo" },
    ],
  },
  {
    id: "M11",
    title: "Subscription & Billing",
    summary: "Plans, trial, payment & verification, expiry/grace, plan changes, feature gating, billing history, pricing page.",
    features: [
      { featureId: "M11-F01", title: "Subscription Plans", modulesStatus: "Done", designStatus: "todo" },
      { featureId: "M11-F02", title: "Trial Period", modulesStatus: "Done", designStatus: "todo" },
      { featureId: "M11-F03", title: "Payment & Verification", modulesStatus: "Planned", designStatus: "todo" },
      { featureId: "M11-F04", title: "Expiry & Grace Period", modulesStatus: "Planned", designStatus: "todo" },
      { featureId: "M11-F05", title: "Plan Changes (Upgrade / Downgrade)", modulesStatus: "Planned", designStatus: "todo" },
      { featureId: "M11-F06", title: "Feature Gating", modulesStatus: "In Progress", designStatus: "todo", note: "Cross-cutting — surfaced inline next to gated features." },
      { featureId: "M11-F07", title: "Billing History", modulesStatus: "Planned", designStatus: "todo" },
      { featureId: "M11-F08", title: "Plan Comparison & Pricing Page", modulesStatus: "Planned", designStatus: "todo" },
    ],
  },
  {
    id: "M12",
    title: "Onboarding & First-Run Experience",
    summary: "Onboarding wizard, dev bypass.",
    features: [
      { featureId: "M12-F01", title: "Onboarding Wizard", modulesStatus: "In Progress", designStatus: "todo" },
      { featureId: "M12-F02", title: "Onboarding Dev Bypass", modulesStatus: "Done", designStatus: "todo", note: "Dev-only — no production UI surface." },
    ],
  },
  {
    id: "M13",
    title: "Staff & Payroll",
    summary: "Employees, salary, advances, attendance.",
    features: [
      { featureId: "M13-F01", title: "Employee Records", modulesStatus: "Planned", designStatus: "todo" },
      { featureId: "M13-F02", title: "Salary Management", modulesStatus: "Planned", designStatus: "todo" },
      { featureId: "M13-F03", title: "Advances & Loans", modulesStatus: "Planned", designStatus: "todo" },
      { featureId: "M13-F04", title: "Attendance & Leaves", modulesStatus: "Planned", designStatus: "todo" },
    ],
  },
  // M14 — Per-Tenant Database Architecture: backend-only, no UI surface, omitted intentionally.
  {
    id: "M15",
    title: "Credit Customer Management",
    summary: "Customer master, credit sales ledger, payment recording, statements.",
    features: [
      { featureId: "M15-F01", title: "Customer Master", modulesStatus: "Planned", designStatus: "todo" },
      { featureId: "M15-F02", title: "Credit Sales Ledger (Party Account)", modulesStatus: "Planned", designStatus: "todo" },
      { featureId: "M15-F03", title: "Payment Recording", modulesStatus: "Planned", designStatus: "todo" },
      { featureId: "M15-F04", title: "Statements & Reports", modulesStatus: "Planned", designStatus: "todo" },
    ],
  },
];

export function findModule(id: string): DesignModule | undefined {
  return DESIGN_CATALOGUE.find((m) => m.id.toLowerCase() === id.toLowerCase());
}

export function findFeature(
  moduleId: string,
  featureId: string,
): { module: DesignModule; feature: DesignScreen } | undefined {
  const module = findModule(moduleId);
  if (!module) return undefined;
  const feature = module.features.find(
    (f) => f.featureId.toLowerCase() === featureId.toLowerCase(),
  );
  if (!feature) return undefined;
  return { module, feature };
}

export function countByDesignStatus(modulesArr: DesignModule[] = DESIGN_CATALOGUE) {
  const counts: Record<DesignStatus, number> = {
    todo: 0,
    "in-progress": 0,
    "in-review": 0,
    approved: 0,
  };
  for (const m of modulesArr) {
    for (const f of m.features) {
      counts[f.designStatus]++;
    }
  }
  return counts;
}
