import { createFileRoute, Link } from "@tanstack/react-router";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { type DesignStatus, type ModulesStatus } from "@/design/catalogue";
import { Route as ModuleRoute } from "./$module";

export const Route = createFileRoute("/design/$module/")({
  component: ModuleIndexPage,
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

function ModuleIndexPage() {
  const { module } = ModuleRoute.useLoaderData();

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-2">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{module.id}</div>
        <h1 className="text-3xl font-semibold tracking-tight">{module.title}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{module.summary}</p>
      </section>

      <Separator />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {module.features.map((feature) => (
          <Link
            key={feature.featureId}
            to="/design/$module/$feature"
            params={{ module: module.id, feature: feature.featureId }}
            className="group focus:outline-none"
          >
            <Card className="h-full transition-shadow group-hover:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-ring">
              <CardHeader className="gap-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-mono">{feature.featureId}</CardTitle>
                  <Badge variant={MODULES_STATUS_TONE[feature.modulesStatus]} className="text-[10px]">
                    {feature.modulesStatus}
                  </Badge>
                </div>
                <CardDescription className="text-sm font-medium text-foreground">
                  {feature.title}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {feature.note ? (
                  <p className="text-xs italic text-muted-foreground">{feature.note}</p>
                ) : null}
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-muted-foreground">Design</span>
                  <Badge variant={DESIGN_STATUS_TONE[feature.designStatus]}>
                    {DESIGN_STATUS_LABEL[feature.designStatus]}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>
    </div>
  );
}
