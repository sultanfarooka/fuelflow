import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { findFeature, type DesignStatus, type ModulesStatus } from "@/design/catalogue";

export const Route = createFileRoute("/design/$module/$feature")({
  loader: ({ params }) => {
    const result = findFeature(params.module, params.feature);
    if (!result) throw notFound();
    return result;
  },
  component: FeatureDesignPage,
});

const DESIGN_STATUS_LABEL: Record<DesignStatus, string> = {
  todo: "To do",
  "in-progress": "In progress",
  "in-review": "In review",
  approved: "Approved",
};

const DESIGN_STATUS_TONE: Record<DesignStatus, "default" | "secondary" | "outline"> = {
  todo: "outline",
  "in-progress": "secondary",
  "in-review": "secondary",
  approved: "default",
};

const MODULES_STATUS_TONE: Record<ModulesStatus, "default" | "secondary" | "outline" | "destructive"> = {
  Done: "default",
  "In Progress": "secondary",
  Planned: "outline",
  "Out of Scope": "destructive",
};

function FeatureDesignPage() {
  const { module, feature } = Route.useLoaderData();

  return (
    <div className="flex flex-col gap-8">
      <nav className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link to="/design" className="hover:underline">All modules</Link>
        <span>/</span>
        <Link to="/design/$module" params={{ module: module.id }} className="hover:underline">
          {module.id} — {module.title}
        </Link>
        <span>/</span>
        <span className="text-foreground">{feature.featureId}</span>
      </nav>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">{feature.title}</h1>
          <Badge variant={MODULES_STATUS_TONE[feature.modulesStatus]}>
            MODULES.md: {feature.modulesStatus}
          </Badge>
          <Badge variant={DESIGN_STATUS_TONE[feature.designStatus]}>
            Design: {DESIGN_STATUS_LABEL[feature.designStatus]}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          <code className="rounded bg-muted px-1 py-0.5 text-xs">{feature.featureId}</code>
          {feature.note ? <span> · {feature.note}</span> : null}
        </p>
      </section>

      <Separator />

      <section>
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base">Screen design pending</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
            <p>
              Replace this placeholder with the designed screen for {feature.featureId} when the
              module&apos;s design pass is run. The screen should:
            </p>
            <ul className="list-disc space-y-1 ps-5">
              <li>Render with mock data from <code className="rounded bg-muted px-1 py-0.5 text-xs">src/design/mocks/{module.id.toLowerCase()}/{feature.featureId.toLowerCase().replace(`${module.id.toLowerCase()}-`, "")}.ts</code>.</li>
              <li>Cover empty, loading, error, and populated states.</li>
              <li>Use only <code className="rounded bg-muted px-1 py-0.5 text-xs">@/components/ui/*</code> primitives and Tailwind logical utilities (<code className="rounded bg-muted px-1 py-0.5 text-xs">ms-*</code> / <code className="rounded bg-muted px-1 py-0.5 text-xs">me-*</code>) so it carries forward into the real route tree.</li>
              <li>Flip <code className="rounded bg-muted px-1 py-0.5 text-xs">designStatus</code> for this entry in <code className="rounded bg-muted px-1 py-0.5 text-xs">src/design/catalogue.ts</code> when shipped.</li>
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
