import { motion } from "motion/react";
import {
  IconAlertTriangle,
  IconArrowRight,
  IconCheck,
  IconClockHour4,
  IconRefresh,
  IconShieldCheck,
} from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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

// M01-F03 verify-result is the landing page reached by clicking the verification
// link in the email — may be a different device / session than the one that
// signed up. Design covers all 4 verify-endpoint outcomes: AC1 verified, AC2
// expired, AC3 invalid/burnt, AC4 already-verified.
type VerifyResultState =
  | "verified"
  | "expired-link"
  | "invalid-link"
  | "already-verified";

const STATES: VerifyResultState[] = [
  "verified",
  "expired-link",
  "invalid-link",
  "already-verified",
];

const STATE_BADGES: Record<VerifyResultState, string> = {
  verified: "Verified (AC1)",
  "expired-link": "Expired (AC2, 410 email_token_expired)",
  "invalid-link": "Invalid (AC3, 410 email_token_invalid)",
  "already-verified": "Already verified (AC4)",
};

type DesignProps = {
  focusVariantId?: string;
  fullscreen?: boolean;
};

const VerifyResultDesign = ({ focusVariantId, fullscreen }: DesignProps = {}) => {
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
        <ResultColumn
          viewport={focused.viewport}
          state={focused.state}
          fullscreen
        />
      </AuthShell>
    );
  }

  const description =
    "Landing page after the user clicks the verification link — same or different device. Four outcomes from the verify endpoint: verified success, expired TTL, invalid/burnt token, or idempotent already-verified.";

  if (focused) {
    return (
      <div className="min-h-screen bg-muted/30 px-4 py-10 text-foreground">
        <div className="mx-auto flex max-w-[1360px] flex-col items-center gap-6">
          <PreviewHeader
            featureId="M01-F03"
            lifecycle="drafting"
            title="Email Verification — Verify result"
            description={description}
          />
          <ViewportFrame
            viewport={focused.viewport}
            stateLabel={STATE_BADGES[focused.state]}
            variantId={focused.id}
            solo
          >
            <AuthShell viewport={focused.viewport}>
              <ResultColumn
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
          title="Email Verification — Verify result"
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
                    <ResultColumn viewport={viewport} state={state} />
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

export default VerifyResultDesign;

type ResultCopy = {
  title: string;
  body: string;
  primaryCta: string;
  primaryIcon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  secondaryCta?: string;
  helperText?: string;
};

const COPY: Record<VerifyResultState, ResultCopy> = {
  verified: {
    title: "Email verified",
    body: "You can now sign in with your email in addition to your phone number.",
    primaryCta: "Sign in to continue",
    primaryIcon: IconArrowRight,
    helperText: "Open Fuel Flow on the device you signed up with, or sign in here.",
  },
  "expired-link": {
    title: "Link expired",
    body: "This verification link expired. Links are valid for 24 hours after they're sent. We can send you a new one.",
    primaryCta: "Resend verification email",
    primaryIcon: IconRefresh,
    secondaryCta: "Back to sign in",
    helperText: "You'll need to enter the email address you registered with.",
  },
  "invalid-link": {
    title: "This link is no longer valid",
    body: "Looks like this link has already been used or was cancelled by a newer verification email. We can send a fresh one.",
    primaryCta: "Resend verification email",
    primaryIcon: IconRefresh,
    secondaryCta: "Back to sign in",
  },
  "already-verified": {
    title: "Already verified",
    body: "Your email is already confirmed. You can sign in with either your phone number or your email.",
    primaryCta: "Sign in to continue",
    primaryIcon: IconArrowRight,
  },
};

const ResultColumn = ({
  viewport,
  state,
  fullscreen = false,
}: {
  viewport: Viewport;
  state: VerifyResultState;
  fullscreen?: boolean;
}) => {
  const isMobile = viewport === "mobile";
  const isTablet = viewport === "tablet";
  const copy = COPY[state];
  const isSuccess = state === "verified" || state === "already-verified";
  const IconEl = copy.primaryIcon;

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
          isMobile ? "max-w-full" : isTablet ? "max-w-[420px]" : "max-w-md",
        )}
      >
        <ResultIcon state={state} />

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

        <div className="flex w-full flex-col gap-2">
          <Button type="button" size="lg" className="w-full">
            <IconEl className="size-4" strokeWidth={2} />
            {copy.primaryCta}
          </Button>
          {copy.secondaryCta ? (
            <Button
              type="button"
              size="lg"
              variant="ghost"
              className="w-full"
            >
              {copy.secondaryCta}
            </Button>
          ) : null}
        </div>

        {copy.helperText ? (
          <p className="text-xs text-muted-foreground">{copy.helperText}</p>
        ) : null}

        {isSuccess ? (
          <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground shadow-xs">
            <IconShieldCheck className="size-3.5 text-success" />
            No auto-sign-in — enter your credentials to continue
          </div>
        ) : null}
      </div>
    </motion.div>
  );
};

const ResultIcon = ({ state }: { state: VerifyResultState }) => {
  const tone = getIconTone(state);

  return (
    <motion.span
      aria-hidden
      className={cn(
        "flex size-16 items-center justify-center rounded-full",
        tone.bg,
        tone.fg,
      )}
      initial={{ scale: 0.4, rotate: -20 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ duration: 0.6, ease: EASE_OUT_BACK }}
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25, delay: 0.25, ease: EASE_OUT_QUART }}
      >
        {state === "verified" ? (
          <IconCheck className="size-8" strokeWidth={2.25} />
        ) : state === "already-verified" ? (
          <IconShieldCheck className="size-8" strokeWidth={2.25} />
        ) : state === "expired-link" ? (
          <IconClockHour4 className="size-8" strokeWidth={2.25} />
        ) : (
          <IconAlertTriangle className="size-8" strokeWidth={2.25} />
        )}
      </motion.span>
    </motion.span>
  );
};

function getIconTone(state: VerifyResultState): { bg: string; fg: string } {
  switch (state) {
    case "verified":
      return { bg: "bg-success/10", fg: "text-success" };
    case "already-verified":
      return { bg: "bg-primary/10", fg: "text-primary" };
    case "expired-link":
      return { bg: "bg-muted", fg: "text-muted-foreground" };
    case "invalid-link":
    default:
      return { bg: "bg-destructive/10", fg: "text-destructive" };
  }
}
