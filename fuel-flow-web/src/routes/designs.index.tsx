import { createFileRoute, Link, Navigate } from "@tanstack/react-router";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const designModules = import.meta.glob("../designs/**/*.tsx");

type DesignEntry = {
  moduleId: string;
  screen: string;
  slug: string;
};

const collectDesigns = (): DesignEntry[] => {
  return Object.keys(designModules)
    .map((path) => {
      const match = path.match(/\/designs\/([^/]+)\/([^/]+)\.tsx$/);
      if (!match) return null;
      const [, moduleId, screen] = match;
      return { moduleId, screen, slug: `${moduleId}/${screen}` } satisfies DesignEntry;
    })
    .filter((entry): entry is DesignEntry => entry !== null)
    .sort((a, b) => a.slug.localeCompare(b.slug));
};

export const Route = createFileRoute("/designs/")({
  component: DesignsIndex,
});

function DesignsIndex() {
  if (!import.meta.env.DEV) {
    return <Navigate to="/" />;
  }

  const designs = collectDesigns();
  const grouped = designs.reduce<Record<string, DesignEntry[]>>((acc, entry) => {
    acc[entry.moduleId] = acc[entry.moduleId] ?? [];
    acc[entry.moduleId].push(entry);
    return acc;
  }, {});
  const moduleIds = Object.keys(grouped).sort();

  return (
    <div className="min-h-screen bg-muted/30 text-foreground">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-6 py-6">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-mono text-[11px]">
              dev only
            </Badge>
            <h1 className="text-xl font-semibold">Design previews</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Throwaway TSX previews of feature screens × viewports × states. Pick a screen to open.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {moduleIds.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-8">
            {moduleIds.map((moduleId) => (
              <section key={moduleId} className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-[11px]">
                    {moduleId}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {grouped[moduleId].length} screen{grouped[moduleId].length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {grouped[moduleId].map((entry) => (
                    <Link
                      key={entry.slug}
                      to="/designs/$"
                      params={{ _splat: entry.slug }}
                      className={cn(
                        "group rounded-xl outline-none transition-all",
                        "focus-visible:ring-3 focus-visible:ring-ring/50",
                      )}
                    >
                      <Card className="h-full transition-shadow group-hover:shadow-md">
                        <CardHeader>
                          <CardTitle className="text-base">{entry.screen}</CardTitle>
                          <CardDescription className="font-mono text-xs">
                            {entry.slug}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <span className="text-xs font-medium text-primary">
                            Open preview →
                          </span>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

const EmptyState = () => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base">No designs yet</CardTitle>
      <CardDescription>
        Add a file under{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">
          src/designs/&lt;module&gt;/&lt;screen&gt;.tsx
        </code>{" "}
        and it will appear here.
      </CardDescription>
    </CardHeader>
  </Card>
);
