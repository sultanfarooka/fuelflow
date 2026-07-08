import { motion } from "motion/react";
import {
  IconAlertHexagon,
  IconClockHour4,
  IconMail,
  IconRefresh,
} from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import {
  AuthShell,
  InlineAlert,
  PreviewHeader,
  Stepper,
  ViewportFrame,
  ViewportSectionHeading,
  columnVariants,
  type Viewport,
} from "@/designs/_shared";

// M01-F03 check-inbox is the in-app state after the SPA queues the verification
// email during registration. Design covers the 3 states the user can actually
// see on this screen: default (email sent, resend enabled), resend cooldown
// (60s throttle, R07), and daily cap reached (terminal, R07).
type CheckInboxState = "default" | "resend-cooldown" | "daily-cap-reached";

const STATES: CheckInboxState[] = [
  "default",
  "resend-cooldown",
  "daily-cap-reached",
];

const STATE_BADGES: Record<CheckInboxState, string> = {
  default: "Default (email queued)",
  "resend-cooldown": "Resend cooldown (R07)",
  "daily-cap-reached": "Daily cap reached (R07)",
};

const SAMPLE_EMAIL = "ali@gmail.com";
const RESEND_COOLDOWN_SECONDS = 42;

const STEPS = [
  { id: 1, label: "Account" },
  { id: 2, label: "Verify phone" },
  { id: 3, label: "Verify email" },
];

type DesignProps = {
  focusVariantId?: string;
  fullscreen?: boolean;
};

const CheckInboxDesign = ({ focusVariantId, fullscreen }: DesignProps = {}) => {
  const viewports: Viewport[] = ["desktop", "tablet", "mobile"];

  const allVariants = viewports.flatMap((viewport) =>
    STATES.map((state) => ({ viewport, state, id: `${viewport}-${state}` })),
  );
  const focused = focusVariantId
    ? allVariants.find((v) => v.id === focusVariantId)
    : null;

  if (fullscreen && focused) {
    return (
      <AuthShell viewport={focused.viewport} fullscreen>
        <CheckInboxColumn
          viewport={focused.viewport}
          state={focused.state}
          fullscreen
        />
      </AuthShell>
    );
  }

  const description =
    "Post-registration status screen — verification email queued to the user's inbox, with masked address, resend throttled to 60s cooldown, and a terminal daily-cap block.";

  if (focused) {
    return (
      <div className="min-h-screen bg-muted/30 px-4 py-10 text-foreground">
        <div className="mx-auto flex max-w-[1360px] flex-col items-center gap-6">
          <PreviewHeader
            featureId="M01-F03"
            lifecycle="drafting"
            title="Email Verification — Check inbox"
            description={description}
          />
          <ViewportFrame
            viewport={focused.viewport}
            stateLabel={STATE_BADGES[focused.state]}
            variantId={focused.id}
            solo
          >
            <AuthShell viewport={focused.viewport}>
              <CheckInboxColumn
                viewport={focused.viewport}
                state={focused.state}
              />
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
          featureId="M01-F03"
          lifecycle="drafting"
          title="Email Verification — Check inbox"
          description={description}
        />

        {viewports.map((viewport) => (
          <section key={viewport} className="flex flex-col gap-6">
            <ViewportSectionHeading viewport={viewport} />
            <div className="flex flex-col items-center gap-8">
              {STATES.map((state) => (
                <ViewportFrame
                  key={`${viewport}-${state}`}
                  viewport={viewport}
                  stateLabel={STATE_BADGES[state]}
                  variantId={`${viewport}-${state}`}
                >
                  <AuthShell viewport={viewport}>
                    <CheckInboxColumn viewport={viewport} state={state} />
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

export default CheckInboxDesign;

const CheckInboxColumn = ({
  viewport,
  state,
  fullscreen = false,
}: {
  viewport: Viewport;
  state: CheckInboxState;
  fullscreen?: boolean;
}) => {
  const isMobile = viewport === "mobile";
  const isTablet = viewport === "tablet";
  const isTerminal = state === "daily-cap-reached";

  return (
    <motion.div
      variants={columnVariants}
      className={cn(
        "flex justify-center",
        fullscreen && !isMobile ? "items-center" : "items-start",
        isMobile ? "px-4 py-8" : isTablet ? "px-8 py-10" : "px-12 py-14",
      )}
    >
      <div
        className={cn(
          "flex w-full flex-col",
          isMobile ? "max-w-full gap-6" : "gap-7",
          !isMobile && (isTablet ? "max-w-[460px]" : "max-w-md"),
        )}
      >
        <div>
          <Stepper steps={STEPS} currentStep={3} />
        </div>

        <div className="flex flex-col items-center gap-5 text-center">
          <span
            aria-hidden
            className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"
          >
            <IconMail className="size-7" strokeWidth={1.75} />
          </span>
          <div className="flex flex-col gap-2">
            <h1
              className={cn(
                "font-semibold tracking-tight",
                isMobile ? "text-xl" : "text-2xl",
              )}
            >
              Check your inbox
            </h1>
            <p className="text-sm text-muted-foreground">
              We&apos;ve sent a verification link to{" "}
              <span className="font-medium text-foreground">
                {SAMPLE_EMAIL}
              </span>
              . Click it to confirm your email address. The link expires in 24 hours.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <IconClockHour4 className="size-4" />
            <span className="text-xs">
              Delivery can take up to a minute. Check your spam folder if you don&apos;t see it.
            </span>
          </div>
        </div>

        {isTerminal ? (
          <InlineAlert
            icon={IconAlertHexagon}
            title="Daily limit reached"
            description="You've requested the maximum number of verification emails for this address today. Try again after midnight PKT."
          />
        ) : (
          <div
            className={cn(
              "flex rounded-lg border border-border bg-card px-4 py-3 text-sm",
              isMobile
                ? "flex-col gap-3"
                : "items-center justify-between",
            )}
          >
            <div className="flex flex-col">
              <span className="font-medium text-foreground">
                Didn&apos;t get the email?
              </span>
              {state === "resend-cooldown" ? (
                <span className="text-xs text-muted-foreground">
                  Wait {RESEND_COOLDOWN_SECONDS} seconds before requesting a new email.
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  We can send a new link. The previous one will be retired.
                </span>
              )}
            </div>
            <Button
              type="button"
              size={isMobile ? "default" : "sm"}
              variant={isMobile ? "outline" : "ghost"}
              disabled={state === "resend-cooldown"}
              className={cn(
                "shrink-0",
                isMobile && "h-11 w-full bg-background",
              )}
            >
              <IconRefresh className="size-3.5" />
              {state === "resend-cooldown"
                ? `Resend in ${RESEND_COOLDOWN_SECONDS}s`
                : "Resend email"}
            </Button>
          </div>
        )}

        <div className="flex flex-col gap-2 text-center text-sm text-muted-foreground">
          <span>
            Wrong address?{" "}
            <button
              type="button"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Skip for now
            </button>{" "}
            — you can verify email later from Settings.
          </span>
          <span>
            Need help?{" "}
            <a
              className="ms-1 font-medium text-foreground underline-offset-4 hover:underline"
              href="#"
            >
              Contact support
            </a>
          </span>
        </div>
      </div>
    </motion.div>
  );
};
