import { MoreHorizontal, Plus, Search, ShieldCheck, UserCog, UserPlus, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { PreviewFrame } from "../preview-frame";

type Role = "Owner" | "Manager" | "Custom";

interface UserRow {
  name: string;
  phone: string;
  email?: string;
  role: Role;
  stations: string[];
  lastActive: string;
  status: "active" | "invited";
}

const USERS: UserRow[] = [
  {
    name: "Asif Ahmed",
    phone: "+92 333 555 1234",
    email: "asif@khanstation.pk",
    role: "Owner",
    stations: ["All stations"],
    lastActive: "2m ago",
    status: "active",
  },
  {
    name: "Sana Rahim",
    phone: "+92 300 111 2233",
    email: "sana@khanstation.pk",
    role: "Manager",
    stations: ["Khan Filling Station — Faisalabad"],
    lastActive: "12m ago",
    status: "active",
  },
  {
    name: "Bilal Hussain",
    phone: "+92 312 887 4400",
    role: "Manager",
    stations: ["Khan Filling Station — Lahore"],
    lastActive: "1h ago",
    status: "active",
  },
  {
    name: "Hamza Sheikh",
    phone: "+92 321 998 6655",
    role: "Custom",
    stations: ["Khan Filling Station — Lahore"],
    lastActive: "Yesterday",
    status: "active",
  },
  {
    name: "Imran Yousaf",
    phone: "+92 335 110 9912",
    role: "Custom",
    stations: ["Khan Filling Station — Faisalabad"],
    lastActive: "Invited 3 days ago",
    status: "invited",
  },
];

const ROLE_TONE: Record<Role, "default" | "secondary" | "outline"> = {
  Owner: "default",
  Manager: "secondary",
  Custom: "outline",
};

function StatCard({ label, value, icon, hint }: { label: string; value: string; icon: React.ReactNode; hint?: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <span className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
          {icon}
        </span>
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
          <span className="text-2xl font-semibold tracking-tight">{value}</span>
          {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
        </div>
      </CardContent>
    </Card>
  );
}

function RolesScreen() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Settings · Users &amp; access</span>
          <h2 className="text-2xl font-semibold tracking-tight">Team &amp; roles</h2>
          <p className="text-sm text-muted-foreground">
            Owner → Manager → Custom Users. Managers can manage their stations; Custom Users get granular permissions per module (M01-F06).
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <UserCog className="me-2 size-4" />
            Role guide
          </Button>
          <Button>
            <UserPlus className="me-2 size-4" />
            Invite user
          </Button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Total users" value="5" icon={<Users className="size-5" />} hint="1 Owner · 2 Managers · 2 Custom" />
        <StatCard label="Active stations" value="2" icon={<ShieldCheck className="size-5" />} hint="Across 1 organisation" />
        <StatCard label="Seats available" value="3 / 8" icon={<UserPlus className="size-5" />} hint="Pro plan · upgrade for more" />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 border-b border-border pb-4 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle className="text-base">Members</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by name or phone" className="ps-8 sm:w-64" />
            </div>
            <Button variant="outline" size="sm">All roles</Button>
            <Button variant="outline" size="sm">All stations</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Stations</TableHead>
                <TableHead>Last active</TableHead>
                <TableHead className="text-end">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {USERS.map((u) => (
                <TableRow key={u.phone}>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-full bg-muted text-xs font-semibold uppercase">
                        {u.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{u.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {u.phone}
                          {u.email ? <span className="ms-2">· {u.email}</span> : null}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={ROLE_TONE[u.role]}>{u.role}</Badge>
                      {u.status === "invited" ? (
                        <Badge variant="outline" className="text-[10px]">Invited</Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {u.stations.join(", ")}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{u.lastActive}</TableCell>
                  <TableCell className="text-end">
                    <Button size="sm" variant="ghost">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function InviteFlow() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">Invite member</span>
        <h2 className="text-xl font-semibold tracking-tight">Add a Manager or Custom User</h2>
        <p className="text-sm text-muted-foreground">
          Owners can create Managers; Managers can create Custom Users with granular permissions.
        </p>
      </header>

      <Card>
        <CardContent className="grid gap-5 p-6 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Full name</label>
            <Input placeholder="e.g. Sana Rahim" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Phone (required)</label>
            <Input placeholder="+92 3XX XXX XXXX" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Email (optional)</label>
            <Input placeholder="name@station.pk" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Role</label>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 justify-start">
                <Badge variant="secondary" className="me-2">Manager</Badge>
                Manages a station
              </Button>
              <Button variant="outline" size="sm" className="flex-1 justify-start">
                <Badge variant="outline" className="me-2">Custom</Badge>
                Per-module access
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="ghost">Cancel</Button>
        <Button>
          <Plus className="me-2 size-4" />
          Send invite
        </Button>
      </div>
    </div>
  );
}

export default function F05RolesHierarchyDesignPage() {
  return (
    <div className="flex flex-col gap-10">
      <PreviewFrame
        title="Team &amp; roles list"
        caption="Owner-only screen, lives at /dashboard/station/:stationId/admin/users in the app shell."
        viewport="shell"
      >
        <RolesScreen />
      </PreviewFrame>

      <PreviewFrame
        title="Invite member"
        caption="Phone required (M01-F09-R01); role picker drives downstream permissions (M01-F06)."
        viewport="shell"
      >
        <InviteFlow />
      </PreviewFrame>
    </div>
  );
}
