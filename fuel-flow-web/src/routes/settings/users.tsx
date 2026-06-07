import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ManagerCreateForm } from "@/components/users/manager-create-form";
import { ManagerList } from "@/components/users/manager-list";
import { ROLES } from "@/lib/roles";
import { requireRoles } from "@/lib/route-guards";

/**
 * /settings/users — Owner-only user management ([M01-F05-R02]). The parent
 * /settings guard already enforces auth + Owner; requireRoles here is
 * belt-and-suspenders. Renders inside the AppShell (settings route component).
 */
export const Route = createFileRoute("/settings/users")({
  beforeLoad: () => requireRoles([ROLES.Owner]),
  component: UsersPage,
});

function UsersPage() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="container mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">
            Create and manage Manager accounts for your organization.
          </p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Close" : "Add manager"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Managers</CardTitle>
        </CardHeader>
        <CardContent>
          <ManagerList />
        </CardContent>
      </Card>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add a manager</CardTitle>
          </CardHeader>
          <CardContent>
            <ManagerCreateForm />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
