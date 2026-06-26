import { Building2, MapPin, Save, ShieldCheck, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

import { PreviewFrame } from "../preview-frame";

interface Station {
  id: string;
  name: string;
  city: string;
  tanks: number;
  nozzles: number;
}

interface Assignment {
  user: string;
  role: "Owner" | "Manager" | "Custom";
  initials: string;
  phone: string;
  stationIds: string[]; // "*" sentinel = all
  primary?: string;
}

const STATIONS: Station[] = [
  { id: "fsd-1", name: "Khan Filling Station — Faisalabad", city: "Faisalabad", tanks: 3, nozzles: 6 },
  { id: "lhr-1", name: "Khan Filling Station — Lahore", city: "Lahore", tanks: 4, nozzles: 8 },
  { id: "lhr-2", name: "Khan — Lahore Cantt", city: "Lahore", tanks: 2, nozzles: 4 },
  { id: "khi-1", name: "Khan — Karachi Shahrah-e-Faisal", city: "Karachi", tanks: 4, nozzles: 8 },
];

const ASSIGNMENTS: Assignment[] = [
  { user: "Asif Ahmed", role: "Owner", initials: "AA", phone: "+92 333 555 1234", stationIds: ["*"] },
  { user: "Sana Rahim", role: "Manager", initials: "SR", phone: "+92 300 111 2233", stationIds: ["fsd-1"], primary: "fsd-1" },
  { user: "Bilal Hussain", role: "Manager", initials: "BH", phone: "+92 312 887 4400", stationIds: ["lhr-1", "lhr-2"], primary: "lhr-1" },
  { user: "Hamza Sheikh", role: "Custom", initials: "HS", phone: "+92 321 998 6655", stationIds: ["lhr-1"] },
];

const ROLE_TONE = {
  Owner: "default",
  Manager: "secondary",
  Custom: "outline",
} as const;

function MultiStationOverview() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">Settings · Multi-station access</span>
        <h2 className="text-2xl font-semibold tracking-tight">Who can see what</h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Owners get a consolidated cross-station view (R02). Managers are scoped to assigned stations (R01).
          Station A&apos;s users can never see Station B&apos;s data (R03).
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <span className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Building2 className="size-4" />
            </span>
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Stations</span>
              <span className="text-xl font-semibold">{STATIONS.length}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <span className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Users className="size-4" />
            </span>
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Team members</span>
              <span className="text-xl font-semibold">{ASSIGNMENTS.length}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <span className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
              <ShieldCheck className="size-4" />
            </span>
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Tenant isolation</span>
              <span className="text-xl font-semibold">Per-tenant DB</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-base">Access matrix</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <div className="min-w-[720px]">
            <div className="grid grid-cols-[minmax(220px,1.4fr)_repeat(4,minmax(140px,1fr))] items-center border-b border-border bg-muted/30 px-5 py-3 text-xs uppercase tracking-wider text-muted-foreground">
              <span>Member</span>
              {STATIONS.map((s) => (
                <span key={s.id} className="flex flex-col text-center">
                  <span className="font-medium text-foreground">{s.name.split("—")[1]?.trim() ?? s.name}</span>
                  <span className="flex items-center justify-center gap-1 text-[10px]">
                    <MapPin className="size-3" />
                    {s.city}
                  </span>
                </span>
              ))}
            </div>
            {ASSIGNMENTS.map((a) => (
              <div
                key={a.user}
                className="grid grid-cols-[minmax(220px,1.4fr)_repeat(4,minmax(140px,1fr))] items-center border-b border-border px-5 py-4 last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                    {a.initials}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{a.user}</span>
                    <span className="text-xs text-muted-foreground">{a.phone}</span>
                  </div>
                  <Badge variant={ROLE_TONE[a.role]} className="ms-auto md:ms-2">
                    {a.role}
                  </Badge>
                </div>
                {STATIONS.map((s) => {
                  const all = a.stationIds.includes("*");
                  const hasAccess = all || a.stationIds.includes(s.id);
                  const isPrimary = a.primary === s.id;
                  return (
                    <div key={s.id} className="flex items-center justify-center">
                      {hasAccess ? (
                        <div className="flex items-center gap-2">
                          <Checkbox checked />
                          {all ? (
                            <Badge variant="outline" className="text-[10px]">All</Badge>
                          ) : isPrimary ? (
                            <Badge variant="secondary" className="text-[10px]">Primary</Badge>
                          ) : null}
                        </div>
                      ) : (
                        <Checkbox />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="ghost">Reset</Button>
        <Button>
          <Save className="me-2 size-4" />
          Save assignments
        </Button>
      </div>
    </div>
  );
}

export default function F07MultiStationAccessDesignPage() {
  return (
    <div className="flex flex-col gap-10">
      <PreviewFrame
        title="Multi-station access matrix"
        caption="Owners auto-have all; Managers scoped per row. Owner-only screen."
        viewport="shell"
      >
        <MultiStationOverview />
      </PreviewFrame>
    </div>
  );
}
