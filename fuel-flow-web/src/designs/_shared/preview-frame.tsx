import { useState } from "react";
import { motion } from "motion/react";
import {
  IconArrowsMaximize,
  IconMoonStars,
  IconRefresh,
  IconSun,
} from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { EASE_OUT_QUART } from "./animation";
import { VIEWPORT_WIDTHS, type Viewport } from "./viewport";

export type PreviewHeaderProps = {
  featureId: string;
  lifecycle: string;
  title: string;
  description?: string;
};

export const PreviewHeader = ({
  featureId,
  lifecycle,
  title,
  description,
}: PreviewHeaderProps) => (
  <header className="flex flex-col gap-2 rounded-xl border border-border bg-card px-5 py-4 shadow-xs">
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="secondary" className="font-mono text-[11px]">
        {featureId}
      </Badge>
      <Badge variant="outline" className="font-mono text-[11px]">
        {lifecycle}
      </Badge>
      <span className="text-base font-semibold">{title}</span>
    </div>
    {description ? (
      <p className="max-w-3xl text-sm text-muted-foreground">{description}</p>
    ) : null}
  </header>
);

export const ViewportSectionHeading = ({
  viewport,
}: {
  viewport: Viewport;
}) => (
  <div className="flex items-center gap-3">
    <Separator className="flex-1" />
    <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
      {viewport} · {VIEWPORT_WIDTHS[viewport]}
    </span>
    <Separator className="flex-1" />
  </div>
);

export type ViewportFrameProps = {
  viewport: Viewport;
  stateLabel: string;
  variantId: string;
  solo?: boolean;
  children: React.ReactNode;
};

export const ViewportFrame = ({
  viewport,
  stateLabel,
  variantId,
  solo = false,
  children,
}: ViewportFrameProps) => {
  const [replayKey, setReplayKey] = useState(0);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const isDark = theme === "dark";
  const fullscreenHref = `?variant=${variantId}&fullscreen=1${
    isDark ? "&theme=dark" : ""
  }`;
  return (
    <div id={variantId} className="flex scroll-mt-20 flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2 ps-1 text-xs font-medium text-muted-foreground">
        <span className="rounded-md border border-border bg-card px-2 py-0.5 font-mono uppercase tracking-wide">
          {viewport}
        </span>
        <span className="rounded-md bg-foreground/5 px-2 py-0.5">
          {stateLabel}
        </span>
        <span className="rounded-md border border-border bg-card px-2 py-0.5 font-mono text-[10px] text-foreground">
          #{variantId}
        </span>
        <button
          type="button"
          onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          aria-pressed={isDark}
          className="ms-auto inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-0.5 font-medium text-foreground hover:bg-muted"
        >
          {isDark ? (
            <IconSun className="size-3" />
          ) : (
            <IconMoonStars className="size-3" />
          )}
          {isDark ? "Light" : "Dark"}
        </button>
        <button
          type="button"
          onClick={() => setReplayKey((k) => k + 1)}
          title="Replay enter animations"
          aria-label="Replay enter animations"
          className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-0.5 font-medium text-foreground hover:bg-muted"
        >
          <motion.span
            key={replayKey}
            initial={{ rotate: 0 }}
            animate={{ rotate: -360 }}
            transition={{ duration: 0.5, ease: EASE_OUT_QUART }}
            className="inline-flex"
          >
            <IconRefresh className="size-3" />
          </motion.span>
          Replay
        </button>
        {solo ? (
          <a
            href="?"
            className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-0.5 font-medium text-foreground hover:bg-muted"
          >
            ← All variants
          </a>
        ) : (
          <a
            href={fullscreenHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-0.5 font-medium text-foreground hover:bg-muted"
          >
            <IconArrowsMaximize className="size-3" />
            Fullscreen
          </a>
        )}
      </div>
      <div
        className={cn(
          "overflow-hidden rounded-2xl border border-border bg-background text-foreground shadow-sm",
          isDark && "dark",
        )}
        style={{ width: VIEWPORT_WIDTHS[viewport] }}
      >
        <div key={replayKey}>{children}</div>
      </div>
    </div>
  );
};
