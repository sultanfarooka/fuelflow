import { lazy, Suspense, useMemo } from "react";
import {
  createFileRoute,
  Link,
  Navigate,
  type LazyRouteComponent,
} from "@tanstack/react-router";
import {
  IconArrowLeft,
  IconExternalLink,
  IconMaximize,
  IconMinimize,
  IconMoonStars,
  IconSun,
} from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type DesignSearch = {
  variant?: string;
  fullscreen?: 1;
  theme?: "dark" | "light";
};

type DesignComponent = React.ComponentType<{
  focusVariantId?: string;
  fullscreen?: boolean;
}>;

const designModules = import.meta.glob("../designs/**/*.tsx");

const buildSlugMap = () => {
  const entries: Record<string, () => Promise<unknown>> = {};
  for (const [path, loader] of Object.entries(designModules)) {
    const match = path.match(/\/designs\/([^/]+)\/([^/]+)\.tsx$/);
    if (!match) continue;
    const [, moduleId, screen] = match;
    entries[`${moduleId}/${screen}`] = loader;
  }
  return entries;
};

const isOne = (v: unknown): v is 1 => v === 1 || v === "1";

export const Route = createFileRoute("/designs/$")({
  validateSearch: (search: Record<string, unknown>): DesignSearch => ({
    variant: typeof search.variant === "string" ? search.variant : undefined,
    fullscreen: isOne(search.fullscreen) ? 1 : undefined,
    theme:
      search.theme === "dark" || search.theme === "light"
        ? search.theme
        : undefined,
  }),
  component: DesignViewer,
});

function DesignViewer() {
  const params = Route.useParams();
  const search = Route.useSearch();
  const slug = params._splat ?? "";
  const slugMap = useMemo(() => buildSlugMap(), []);
  const loader = slugMap[slug];
  const fullscreen = search.fullscreen === 1;
  const isDark = search.theme === "dark";

  const LazyDesign = useMemo(() => {
    if (!loader) return null;
    return lazy(async () => {
      const mod = (await loader()) as { default: DesignComponent };
      return { default: mod.default };
    }) as LazyRouteComponent<DesignComponent>;
  }, [loader]);

  if (!import.meta.env.DEV) {
    return <Navigate to="/" />;
  }

  if (!LazyDesign) {
    return <NotFound slug={slug} />;
  }

  if (fullscreen) {
    return (
      <div
        className={cn(
          "relative bg-background text-foreground",
          isDark && "dark",
        )}
      >
        <Suspense fallback={<LoadingState />}>
          <LazyDesign focusVariantId={search.variant} fullscreen />
        </Suspense>
        <div className="fixed bottom-4 end-4 z-50 flex items-center gap-2">
          <Link
            to="/designs/$"
            params={{ _splat: slug }}
            search={{
              variant: search.variant,
              fullscreen: 1,
              theme: isDark ? "light" : "dark",
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/90 px-3 py-1.5 text-xs font-medium text-foreground shadow-md backdrop-blur hover:bg-background"
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? (
              <IconSun className="size-3.5" />
            ) : (
              <IconMoonStars className="size-3.5" />
            )}
            {isDark ? "Light" : "Dark"}
          </Link>
          <Link
            to="/designs/$"
            params={{ _splat: slug }}
            search={{ variant: search.variant }}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/90 px-3 py-1.5 text-xs font-medium text-foreground shadow-md backdrop-blur hover:bg-background"
          >
            <IconMinimize className="size-3.5" />
            Exit fullscreen
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link to="/designs">
                <IconArrowLeft className="size-4" />
                All designs
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-mono text-[11px]">
                preview
              </Badge>
              <span className="font-mono text-sm">{slug}</span>
              {search.variant ? (
                <Badge variant="outline" className="font-mono text-[11px]">
                  #{search.variant}
                </Badge>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {search.variant ? (
              <Button asChild variant="outline" size="sm">
                <Link
                  to="/designs/$"
                  params={{ _splat: slug }}
                  search={{ variant: search.variant, fullscreen: 1 }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <IconMaximize className="size-3.5" />
                  Open fullscreen
                </Link>
              </Button>
            ) : null}
            <Badge variant="outline" className="gap-1 font-mono text-[11px]">
              <IconExternalLink className="size-3" />
              dev only
            </Badge>
          </div>
        </div>
      </header>

      <Suspense fallback={<LoadingState />}>
        <LazyDesign focusVariantId={search.variant} />
      </Suspense>
    </div>
  );
}

const NotFound = ({ slug }: { slug: string }) => (
  <div className="mx-auto flex max-w-xl flex-col gap-4 px-6 py-16 text-center">
    <Badge variant="outline" className="mx-auto font-mono text-[11px]">
      404
    </Badge>
    <h1 className="text-xl font-semibold">No design at this slug</h1>
    <p className="text-sm text-muted-foreground">
      Nothing matched <span className="font-mono">{slug || "(empty)"}</span>. Add a file under
      <span className="mx-1 font-mono">src/designs/&lt;module&gt;/&lt;screen&gt;.tsx</span>
      and it will show up here.
    </p>
    <Button asChild variant="outline">
      <Link to="/designs">Back to index</Link>
    </Button>
  </div>
);

const LoadingState = () => (
  <div className="mx-auto max-w-xl px-6 py-16 text-center text-sm text-muted-foreground">
    Loading preview…
  </div>
);
