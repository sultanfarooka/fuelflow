import { createFileRoute, Link } from "@tanstack/react-router";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { countByDesignStatus, DESIGN_CATALOGUE, type DesignStatus } from "@/design/catalogue";

export const Route = createFileRoute("/design/")({
  component: DesignIndex,
});

const STATUS_LABEL: Record<DesignStatus, string> = {
  todo: "To do",
  "in-progress": "In progress",
  "in-review": "In review",
  approved: "Approved",
};

const STATUS_TONE: Record<DesignStatus, "default" | "secondary" | "outline"> = {
  todo: "outline",
  "in-progress": "secondary",
  "in-review": "secondary",
  approved: "default",
};

function DesignIndex() {
  const totals = countByDesignStatus();
  const totalScreens = DESIGN_CATALOGUE.reduce((acc, m) => acc + m.features.length, 0);

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Design playground</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          One screen per <code className="rounded bg-muted px-1 py-0.5 text-xs">MXX-FXX</code> feature in
          {" "}
          <a href="/docs/MODULES.md" className="underline">docs/MODULES.md</a>. Screens here use mock data only —
          no API calls, no auth wiring. When a module&apos;s UI is approved here, its components get lifted into
          the real route tree by the <code className="rounded bg-muted px-1 py-0.5 text-xs">/module-implementation</code> flow.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline">{totalScreens} screens</Badge>
          <span>·</span>
          <span>Approved {totals.approved}</span>
          <span>·</span>
          <span>In review {totals["in-review"]}</span>
          <span>·</span>
          <span>In progress {totals["in-progress"]}</span>
          <span>·</span>
          <span>To do {totals.todo}</span>
        </div>
      </section>

      <Separator />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {DESIGN_CATALOGUE.map((module) => {
          const moduleCounts = countByDesignStatus([module]);
          const approvedPct = Math.round((moduleCounts.approved / module.features.length) * 100);
          return (
            <Link
              key={module.id}
              to="/design/$module"
              params={{ module: module.id }}
              className="group focus:outline-none"
            >
              <Card className="h-full transition-shadow group-hover:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-ring">
                <CardHeader className="gap-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{module.id}</CardTitle>
                    <Badge variant="outline" className="text-[10px]">{module.features.length} screens</Badge>
                  </div>
                  <CardDescription className="text-sm font-medium text-foreground">
                    {module.title}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <p className="text-xs text-muted-foreground">{module.summary}</p>
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                    {(["approved", "in-review", "in-progress", "todo"] as const).map((s) =>
                      moduleCounts[s] ? (
                        <Badge key={s} variant={STATUS_TONE[s]}>
                          {STATUS_LABEL[s]}: {moduleCounts[s]}
                        </Badge>
                      ) : null,
                    )}
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${approvedPct}%` }}
                      aria-label={`${approvedPct}% approved`}
                    />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
