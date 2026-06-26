import {
  Banknote,
  Calendar,
  Download,
  FileWarning,
  Filter,
  LogIn,
  Pencil,
  Search,
  ShieldOff,
  Trash2,
  UserPlus,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { PreviewFrame } from "../preview-frame";

type AuditAction = "price-change" | "user-create" | "stock-adjust" | "credit-delete" | "login" | "permission-change";

interface AuditRow {
  when: string;
  user: string;
  initials: string;
  action: AuditAction;
  entity: string;
  before?: string;
  after?: string;
  ip: string;
  note?: string;
}

const ACTIONS: Record<AuditAction, { label: string; icon: React.ReactNode; tone: string }> = {
  "price-change": { label: "Price change", icon: <Banknote className="size-3.5" />, tone: "bg-chart-4/15 text-foreground" },
  "user-create": { label: "User created", icon: <UserPlus className="size-3.5" />, tone: "bg-primary/10 text-primary" },
  "stock-adjust": { label: "Stock adjusted", icon: <Pencil className="size-3.5" />, tone: "bg-chart-2/15 text-foreground" },
  "credit-delete": { label: "Credit entry deleted", icon: <Trash2 className="size-3.5" />, tone: "bg-destructive/10 text-destructive" },
  login: { label: "Sign-in", icon: <LogIn className="size-3.5" />, tone: "bg-muted text-muted-foreground" },
  "permission-change": { label: "Permission change", icon: <ShieldOff className="size-3.5" />, tone: "bg-chart-5/15 text-foreground" },
};

const ROWS: AuditRow[] = [
  {
    when: "27 Jun 2026 · 14:32",
    user: "Asif Ahmed",
    initials: "AA",
    action: "price-change",
    entity: "Diesel (HSD) · Khan FSD",
    before: "Rs. 279.50 / L",
    after: "Rs. 282.10 / L",
    ip: "203.135.44.12",
  },
  {
    when: "27 Jun 2026 · 13:08",
    user: "Sana Rahim",
    initials: "SR",
    action: "user-create",
    entity: "Imran Yousaf (Custom)",
    after: "Invited · pending OTP",
    ip: "203.135.44.40",
  },
  {
    when: "27 Jun 2026 · 11:51",
    user: "Bilal Hussain",
    initials: "BH",
    action: "stock-adjust",
    entity: "Tank-02 (Petrol)",
    before: "12,400 L",
    after: "12,180 L",
    note: "Variance reconciliation post-dip",
    ip: "39.50.108.22",
  },
  {
    when: "26 Jun 2026 · 19:12",
    user: "Hamza Sheikh",
    initials: "HS",
    action: "credit-delete",
    entity: "Faiz Brothers — Inv #20461",
    before: "Rs. 18,400 · 18 Jun",
    after: "Deleted",
    note: "Customer disputed; manager-approved",
    ip: "39.50.108.22",
  },
  {
    when: "26 Jun 2026 · 09:00",
    user: "Asif Ahmed",
    initials: "AA",
    action: "permission-change",
    entity: "Hamza Sheikh — Pricing",
    before: "View",
    after: "Edit",
    ip: "203.135.44.12",
  },
  {
    when: "26 Jun 2026 · 08:45",
    user: "Sana Rahim",
    initials: "SR",
    action: "login",
    entity: "Phone +92 300 111 2233",
    after: "Success",
    ip: "203.135.44.40",
  },
];

function FilterChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <button
      type="button"
      className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs hover:bg-muted/60"
    >
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </button>
  );
}

function AuditScreen() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Settings · Audit log</span>
          <h2 className="text-2xl font-semibold tracking-tight">Activity audit trail</h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Every sensitive action — price changes, user changes, stock adjustments, credit deletions — is logged with
            before / after values. Audit rows are immutable and never deleted (M01-F08-R05).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="me-2 size-4" />
            Export CSV
          </Button>
          <Button>
            <Filter className="me-2 size-4" />
            Save view
          </Button>
        </div>
      </header>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by user, entity, IP or value" className="ps-8" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <FilterChip icon={<Calendar className="size-3.5" />} label="Date" value="Last 7 days" />
            <FilterChip icon={<UserPlus className="size-3.5" />} label="User" value="Any" />
            <FilterChip icon={<FileWarning className="size-3.5" />} label="Action" value="All 6 types" />
            <Badge variant="outline" className="ms-1">{ROWS.length} entries</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-base">Events</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border p-0">
          {ROWS.map((row, idx) => {
            const meta = ACTIONS[row.action];
            return (
              <div key={idx} className="grid gap-4 px-5 py-4 md:grid-cols-[minmax(140px,160px)_minmax(220px,1fr)_minmax(260px,1.4fr)_minmax(120px,140px)]">
                <div className="flex flex-col text-xs">
                  <span className="font-medium text-foreground">{row.when.split("·")[0].trim()}</span>
                  <span className="text-muted-foreground">{row.when.split("·")[1]?.trim()}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-full bg-muted text-[10px] font-semibold">
                    {row.initials}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{row.user}</span>
                    <span className="text-xs text-muted-foreground">{row.ip}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${meta.tone}`}
                    >
                      {meta.icon}
                      {meta.label}
                    </span>
                    <span className="text-xs font-medium text-foreground">{row.entity}</span>
                  </div>
                  {row.before || row.after ? (
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      {row.before ? (
                        <>
                          <span className="rounded bg-muted px-1.5 py-0.5">before</span>
                          <span className="line-through">{row.before}</span>
                        </>
                      ) : null}
                      {row.before && row.after ? <span>→</span> : null}
                      {row.after ? (
                        <>
                          <span className="rounded bg-success/10 px-1.5 py-0.5 text-success">after</span>
                          <span className="text-foreground">{row.after}</span>
                        </>
                      ) : null}
                    </div>
                  ) : null}
                  {row.note ? (
                    <span className="text-xs italic text-muted-foreground">“{row.note}”</span>
                  ) : null}
                </div>
                <div className="flex items-start justify-end">
                  <Button size="sm" variant="ghost" className="text-xs">View detail</Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

export default function F08AuditTrailDesignPage() {
  return (
    <div className="flex flex-col gap-10">
      <PreviewFrame
        title="Audit log viewer"
        caption="Owner-only. Append-only. Filter by user, entity, action, date range (R06)."
        viewport="shell"
      >
        <AuditScreen />
      </PreviewFrame>
    </div>
  );
}
