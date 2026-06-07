import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getManagers } from "@/lib/api/users";
import { useAuthStore } from "@/stores/auth-store";

/**
 * Manager list for the Owner's organization ([M01-F05-R02]). Status column
 * derives from `phoneConfirmed`: Active vs "Pending OTP" (invited, not yet activated).
 */
export function ManagerList() {
  const { organization } = useAuthStore();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["managers", organization?.id],
    queryFn: getManagers,
  });
  const managers = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive">
        Could not load managers. Please refresh and try again.
      </p>
    );
  }

  if (managers.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No managers yet. Add one with the form below.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Stations</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {managers.map((m) => (
          <TableRow key={m.id}>
            <TableCell className="font-medium">{m.fullName}</TableCell>
            <TableCell>{m.phone ?? "—"}</TableCell>
            <TableCell>{m.email ?? "—"}</TableCell>
            <TableCell>
              <span className="flex flex-wrap gap-1">
                {m.stations.length === 0 ? (
                  <span className="text-muted-foreground">—</span>
                ) : (
                  m.stations.map((s) => (
                    <Badge key={s.id} variant="secondary">
                      {s.name}
                    </Badge>
                  ))
                )}
              </span>
            </TableCell>
            <TableCell>
              {m.phoneConfirmed ? (
                <Badge variant="secondary">Active</Badge>
              ) : (
                <Badge variant="outline">Pending OTP</Badge>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
