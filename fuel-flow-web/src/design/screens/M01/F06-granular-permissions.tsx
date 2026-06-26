import { ChevronDown, Eye, Lock, Pencil, Save, ShieldAlert, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { PreviewFrame } from "../preview-frame";

type Permission = "none" | "view" | "edit" | "delete";

interface ModuleRow {
  id: string;
  module: string;
  description: string;
  permission: Permission;
}

const PERMISSIONS: Permission[] = ["none", "view", "edit", "delete"];

const PERMISSION_META: Record<Permission, { label: string; icon: React.ReactNode; tone: string; description: string }> = {
  none: {
    label: "No access",
    icon: <Lock className="size-3.5" />,
    tone: "bg-muted text-muted-foreground",
    description: "User cannot see or open this module",
  },
  view: {
    label: "View",
    icon: <Eye className="size-3.5" />,
    tone: "bg-primary/10 text-primary",
    description: "Read-only access",
  },
  edit: {
    label: "Edit",
    icon: <Pencil className="size-3.5" />,
    tone: "bg-chart-4/15 text-foreground",
    description: "View, create and update",
  },
  delete: {
    label: "Delete",
    icon: <Trash2 className="size-3.5" />,
    tone: "bg-destructive/10 text-destructive",
    description: "Full access including hard-delete",
  },
};

const ROWS: ModuleRow[] = [
  { id: "shifts", module: "Shifts (M04)", description: "Open/close shifts, settlement, cash collection", permission: "edit" },
  { id: "nozzles", module: "Nozzle operations (M03)", description: "Meter readings, sales calculation", permission: "edit" },
  { id: "inventory", module: "Fuel inventory (M02)", description: "Tanks, dip readings, deliveries", permission: "view" },
  { id: "pricing", module: "Pricing (M06)", description: "Price changes, margins, promotions", permission: "none" },
  { id: "credit", module: "Credit customers (M15)", description: "Party accounts, credit sales, statements", permission: "view" },
  { id: "finance", module: "Finance &amp; accounts (M05)", description: "AR/AP, expenses, banks, ledgers", permission: "none" },
  { id: "reports", module: "Reports (M07)", description: "Sales, inventory, financial reports", permission: "view" },
  { id: "settings", module: "Settings (M08)", description: "Station profile, tanks, fuel types", permission: "none" },
];

function PermissionPill({ p, active }: { p: Permission; active: boolean }) {
  const meta = PERMISSION_META[p];
  return (
    <button
      type="button"
      className={cn(
        "flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md text-xs font-medium transition-colors",
        active ? meta.tone + " ring-2 ring-ring/40" : "bg-background text-muted-foreground ring-1 ring-border hover:bg-muted/60",
      )}
    >
      {meta.icon}
      {meta.label}
    </button>
  );
}

function PermissionsScreen() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Settings · Permissions</span>
          <h2 className="text-2xl font-semibold tracking-tight">Module permissions</h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Set per-module access for Custom Users. Permission checks are enforced at the API too (M01-F06-R02) — frontend gating is UX only.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">Copy from another user</Button>
          <Button>
            <Save className="me-2 size-4" />
            Save changes
          </Button>
        </div>
      </header>

      <Card>
        <CardContent className="grid gap-4 p-5 md:grid-cols-[1fr_auto_1fr] md:items-center">
          <button
            type="button"
            className="flex items-center gap-3 rounded-md border border-border bg-background p-3 text-start hover:bg-muted/40"
          >
            <div className="flex size-9 items-center justify-center rounded-full bg-muted text-xs font-semibold">HS</div>
            <div className="flex flex-1 flex-col">
              <span className="text-sm font-medium">Hamza Sheikh</span>
              <span className="text-xs text-muted-foreground">+92 321 998 6655 · Khan Filling Station — Lahore</span>
            </div>
            <ChevronDown className="size-4 text-muted-foreground" />
          </button>
          <div className="hidden text-xs uppercase tracking-wider text-muted-foreground md:block">Role</div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Custom user</Badge>
            <span className="text-xs text-muted-foreground">
              Changes take effect on the user&apos;s next API call (R04) — no re-login needed.
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-base">Module access</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border p-0">
          {ROWS.map((row) => (
            <div
              key={row.id}
              className="grid items-center gap-3 px-5 py-4 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]"
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium">{row.module}</span>
                <span className="text-xs text-muted-foreground">{row.description}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {PERMISSIONS.map((p) => (
                  <PermissionPill key={p} p={p} active={row.permission === p} />
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex items-start gap-3 rounded-md border border-border bg-muted/40 p-4 text-xs text-muted-foreground">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-primary" />
        <p>
          Each permission is enforced on every API call (M01-F06-R02). UI restrictions only hide the affordance —
          the backend is the source of truth for authorisation.
        </p>
      </div>
    </div>
  );
}

export default function F06GranularPermissionsDesignPage() {
  return (
    <div className="flex flex-col gap-10">
      <PreviewFrame
        title="Module permission matrix"
        caption="Per-user, per-module: None / View / Edit / Delete. API enforces, UI hides."
        viewport="shell"
      >
        <PermissionsScreen />
      </PreviewFrame>
    </div>
  );
}
