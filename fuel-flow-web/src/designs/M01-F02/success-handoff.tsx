import { AnimatePresence, motion } from "motion/react";
import { IconCheck, IconLoader2 } from "@tabler/icons-react";

import { cn } from "@/lib/utils";

import {
  AuthShell,
  EASE_OUT_BACK,
  EASE_OUT_QUART,
  PreviewHeader,
  ViewportFrame,
  ViewportSectionHeading,
  columnVariants,
  type Viewport,
} from "@/designs/_shared";

// The success handoff is a ~800ms confirmation before the SPA routes onward.
// Four purposes drive four subtly-different copy variants.
type SuccessState =
  | "registration"
  | "login"
  | "phone-change"
  | "already-verified";

const SUCCESS_STATES: SuccessState[] = [
  "registration",
  "login",
  "phone-change",
  "already-verified",
];

const STATE_BADGES: Record<SuccessState, string> = {
  registration: "Purpose · registration",
  login: "Purpose · login",
  "phone-change": "Purpose · phone-change",
  "already-verified": "Idempotent (AC8)",
};

type Copy = {
  title: string;
  body: string;
  route: string;
};

const COPY: Record<SuccessState, Copy> = {
  registration: {
    title: "Phone verified",
    body: "Setting up your account…",
    route: "/onboarding",
  },
  login: {
    title: "Phone verified",
    body: "Signing you in…",
    route: "/dashboard",
  },
  "phone-change": {
    title: "Phone updated",
    body: "Returning to settings…",
    route: "/settings/security",
  },
  "already-verified": {
    title: "Phone verified",
    body: "This number is already confirmed. Taking you back…",
    route: "/dashboard",
  },
};

type DesignProps = {
  focusVariantId?: string;
  fullscreen?: boolean;
};

const SuccessHandoffDesign = ({ focusVariantId, fullscreen }: DesignProps = {}) => {
  const viewports: Viewport[] = ["desktop", "tablet", "mobile"];

  const allVariants = viewports.flatMap((viewport) =>
    SUCCESS_STATES.map((state) => ({ viewport, state, id: `${viewport}-${state}` })),
  );
  const focused = focusVariantId
    ? allVariants.find((v) => v.id === focusVariantId)
    : null;

  if (fullscreen && focused) {
    return (
      <AuthShell viewport={focused.viewport} fullscreen>
        <SuccessColumn viewport={focused.viewport} state={focused.state} fullscreen />
      </AuthShell>
    );
  }

  const description =
    "Transient ~800ms confirmation with check-icon draw-in, then route to the originating flow.";

  if (focused) {
    return (
      <div className="min-h-screen bg-muted/30 px-4 py-10 text-foreground">
        <div className="mx-auto flex max-w-[1360px] flex-col items-center gap-6">
          <PreviewHeader
            featureId="M01-F02"
            lifecycle="spec-locked"
            title="Phone OTP — Success Handoff"
            description={description}
          />
          <ViewportFrame
            viewport={focused.viewport}
            stateLabel={STATE_BADGES[focused.state]}
            variantId={focused.id}
            solo
          >
            <AuthShell viewport={focused.viewport}>
              <SuccessColumn viewport={focused.viewport} state={focused.state} />
            </AuthShell>
          </ViewportFrame>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-10 text-foreground">
      <div className="mx-auto flex max-w-[1360px] flex-col gap-8">
        <PreviewHeader
          featureId="M01-F02"
          lifecycle="spec-locked"
          title="Phone OTP — Success Handoff"
          description={description}
        />

        {viewports.map((viewport) => (
          <section key={viewport} className="flex flex-col gap-6">
            <ViewportSectionHeading viewport={viewport} />
            <div className="flex flex-col items-center gap-8">
              {SUCCESS_STATES.map((state) => (
                <ViewportFrame
                  key={`${viewport}-${state}`}
                  viewport={viewport}
                  stateLabel={STATE_BADGES[state]}
                  variantId={`${viewport}-${state}`}
                >
                  <AuthShell viewport={viewport}>
                    <SuccessColumn viewport={viewport} state={state} />
                  </AuthShell>
                </ViewportFrame>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

export default SuccessHandoffDesign;

const SuccessColumn = ({
  viewport,
  state,
  fullscreen = false,
}: {
  viewport: Viewport;
  state: SuccessState;
  fullscreen?: boolean;
}) => {
  const isMobile = viewport === "mobile";
  const isTablet = viewport === "tablet";
  const copy = COPY[state];

  return (
    <motion.div
      variants={columnVariants}
      className={cn(
        "flex justify-center",
        fullscreen && !isMobile ? "items-center" : "items-center",
        isMobile ? "px-4 py-12" : isTablet ? "px-8 py-16" : "px-12 py-20",
      )}
    >
      <div
        className={cn(
          "flex w-full flex-col items-center gap-6 text-center",
          isMobile ? "max-w-full" : isTablet ? "max-w-[400px]" : "max-w-md",
        )}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`success-${state}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, ease: EASE_OUT_QUART }}
            className="flex flex-col items-center gap-5"
          >
            <motion.span
              aria-hidden
              className="flex size-16 items-center justify-center rounded-full bg-success/10 text-success"
              initial={{ scale: 0.4, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.6, ease: EASE_OUT_BACK }}
            >
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  duration: 0.25,
                  delay: 0.25,
                  ease: EASE_OUT_QUART,
                }}
              >
                <IconCheck className="size-8" strokeWidth={2.5} />
              </motion.span>
            </motion.span>

            <div className="flex flex-col gap-2">
              <h1
                className={cn(
                  "font-semibold tracking-tight",
                  isMobile ? "text-2xl" : "text-3xl",
                )}
              >
                {copy.title}
              </h1>
              <p className="text-sm text-muted-foreground">{copy.body}</p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground shadow-xs">
              <IconLoader2 className="size-3 animate-spin" />
              Redirecting to{" "}
              <span className="font-mono font-medium text-foreground">
                {copy.route}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
