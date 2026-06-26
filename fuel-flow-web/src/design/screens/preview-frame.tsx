import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const VIEWPORT_CLASS: Record<Viewport, string> = {
  desktop: "max-w-none",
  tablet: "max-w-3xl",
  mobile: "max-w-sm",
  shell: "max-w-none",
};

const VIEWPORT_LABEL: Record<Viewport, string> = {
  desktop: "Desktop · ≥ 1024px",
  tablet: "Tablet · 768px",
  mobile: "Mobile · 375px",
  shell: "Inside app shell",
};

export type Viewport = "desktop" | "tablet" | "mobile" | "shell";

interface PreviewFrameProps {
  title: string;
  caption?: string;
  viewport?: Viewport;
  /** Optional badge label rendered alongside the viewport label (e.g. "Empty state"). */
  state?: string;
  /** When true the frame body has no padding so the screen can paint edge-to-edge. */
  bleed?: boolean;
  children: ReactNode;
}

export function PreviewFrame({
  title,
  caption,
  viewport = "desktop",
  state,
  bleed = false,
  children,
}: PreviewFrameProps) {
  return (
    <section className="flex flex-col gap-3">
      <header className="flex flex-wrap items-end justify-between gap-2 px-1">
        <div className="flex flex-col">
          <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
          {caption ? <p className="text-xs text-muted-foreground">{caption}</p> : null}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <Badge variant="outline">{VIEWPORT_LABEL[viewport]}</Badge>
          {state ? <Badge variant="secondary">{state}</Badge> : null}
        </div>
      </header>
      <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
        <div className={cn("mx-auto", VIEWPORT_CLASS[viewport])}>
          <div className={cn(bleed ? "" : "p-6 md:p-8")}>{children}</div>
        </div>
      </div>
    </section>
  );
}
