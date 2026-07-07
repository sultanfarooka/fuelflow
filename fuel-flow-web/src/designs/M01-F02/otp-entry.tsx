import { motion } from "motion/react";
import {
  IconAlertHexagon,
  IconClockHour4,
  IconLoader2,
  IconLock,
  IconRefresh,
  IconShieldExclamation,
} from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  AuthShell,
  INPUT_FOCUS_RING,
  InlineAlert,
  PreviewHeader,
  SHAKE_KEYFRAMES,
  Stepper,
  ViewportFrame,
  ViewportSectionHeading,
  columnVariants,
  type Viewport,
} from "@/designs/_shared";

// M01-F02 has its own state enum (8 distinct visual states) — the shared
// FormState six-tuple doesn't fit OTP entry.
type OtpEntryState =
  | "default"
  | "typing"
  | "verifying"
  | "wrong-code"
  | "locked"
  | "expired"
  | "resend-cooldown"
  | "daily-cap";

const OTP_STATES: OtpEntryState[] = [
  "default",
  "typing",
  "verifying",
  "wrong-code",
  "locked",
  "expired",
  "resend-cooldown",
  "daily-cap",
];

const STATE_BADGES: Record<OtpEntryState, string> = {
  default: "Default",
  typing: "Typing (partial)",
  verifying: "Verifying",
  "wrong-code": "Wrong code",
  locked: "Locked (3rd fail)",
  expired: "Expired (TTL)",
  "resend-cooldown": "Resend cooldown",
  "daily-cap": "Daily cap reached",
};

const SAMPLE_PHONE_MASKED = "+92 300 ****567";
const RESEND_COOLDOWN_SECONDS = 42;
const ATTEMPTS_REMAINING = 2;

const STEPS = [
  { id: 1, label: "Account" },
  { id: 2, label: "Verify phone" },
];

type DesignProps = {
  focusVariantId?: string;
  fullscreen?: boolean;
};

const OtpEntryDesign = ({ focusVariantId, fullscreen }: DesignProps = {}) => {
  const viewports: Viewport[] = ["desktop", "tablet", "mobile"];

  const allVariants = viewports.flatMap((viewport) =>
    OTP_STATES.map((state) => ({ viewport, state, id: `${viewport}-${state}` })),
  );
  const focused = focusVariantId
    ? allVariants.find((v) => v.id === focusVariantId)
    : null;

  if (fullscreen && focused) {
    return (
      <AuthShell viewport={focused.viewport} fullscreen>
        <OtpColumn viewport={focused.viewport} state={focused.state} fullscreen />
      </AuthShell>
    );
  }

  const description =
    "6-cell code entry with masked phone, auto-submit on the last digit, resend cooldown, and terminal daily-cap block.";

  if (focused) {
    return (
      <div className="min-h-screen bg-muted/30 px-4 py-10 text-foreground">
        <div className="mx-auto flex max-w-[1360px] flex-col items-center gap-6">
          <PreviewHeader
            featureId="M01-F02"
            lifecycle="spec-locked"
            title="Phone OTP Verification"
            description={description}
          />
          <ViewportFrame
            viewport={focused.viewport}
            stateLabel={STATE_BADGES[focused.state]}
            variantId={focused.id}
            solo
          >
            <AuthShell viewport={focused.viewport}>
              <OtpColumn viewport={focused.viewport} state={focused.state} />
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
          title="Phone OTP Verification"
          description={description}
        />

        {viewports.map((viewport) => (
          <section key={viewport} className="flex flex-col gap-6">
            <ViewportSectionHeading viewport={viewport} />
            <div className="flex flex-col items-center gap-8">
              {OTP_STATES.map((state) => (
                <ViewportFrame
                  key={`${viewport}-${state}`}
                  viewport={viewport}
                  stateLabel={STATE_BADGES[state]}
                  variantId={`${viewport}-${state}`}
                >
                  <AuthShell viewport={viewport}>
                    <OtpColumn viewport={viewport} state={state} />
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

export default OtpEntryDesign;

const OtpColumn = ({
  viewport,
  state,
  fullscreen = false,
}: {
  viewport: Viewport;
  state: OtpEntryState;
  fullscreen?: boolean;
}) => {
  const isMobile = viewport === "mobile";
  const isTablet = viewport === "tablet";

  const codeCells = getCodeCells(state);
  const cellsInvalid = state === "wrong-code";
  const cellsDisabled =
    state === "verifying" ||
    state === "locked" ||
    state === "expired" ||
    state === "daily-cap";
  const isTerminal = state === "daily-cap";

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
          <Stepper steps={STEPS} currentStep={2} />
        </div>

        <div className="flex flex-col gap-1.5">
          <h1
            className={cn(
              "font-semibold tracking-tight",
              isMobile ? "text-xl" : "text-2xl",
            )}
          >
            Verify your phone
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter the 6-digit code we sent to{" "}
            <span className="font-medium text-foreground">{SAMPLE_PHONE_MASKED}</span>
            .{" "}
            <button
              type="button"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Wrong number?
            </button>
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {state === "verifying" ? (
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <IconLoader2 className="size-4 animate-spin" />
              Verifying code…
            </div>
          ) : null}

          <motion.div
            key={cellsInvalid ? "shake" : "idle"}
            animate={cellsInvalid ? { x: SHAKE_KEYFRAMES } : { x: 0 }}
            transition={{ duration: 0.45, ease: "easeInOut" }}
            className="grid grid-cols-6 gap-2"
            role="group"
            aria-label="One-time code"
          >
            {codeCells.map((digit, idx) => (
              <Input
                key={idx}
                inputMode="numeric"
                maxLength={1}
                autoComplete={idx === 0 ? "one-time-code" : undefined}
                defaultValue={digit}
                disabled={cellsDisabled}
                aria-invalid={cellsInvalid || undefined}
                aria-label={`Digit ${idx + 1}`}
                className={cn(
                  "h-14 w-full text-center text-2xl font-semibold tabular-nums",
                  INPUT_FOCUS_RING,
                  cellsInvalid && "border-destructive text-destructive",
                )}
              />
            ))}
          </motion.div>

          <div className="min-h-[20px] text-xs text-muted-foreground">
            {state === "default" ? (
              <span>Paste supported. We&apos;ll verify as soon as the last digit is entered.</span>
            ) : null}
            {state === "typing" ? (
              <span>Keep going — 3 digits left.</span>
            ) : null}
            {state === "wrong-code" ? (
              <span className="font-medium text-destructive">
                Verification failed. {ATTEMPTS_REMAINING} attempts remaining.
              </span>
            ) : null}
            {state === "verifying" ? <span>Please wait…</span> : null}
          </div>
        </div>

        {state === "wrong-code" ? (
          <InlineAlert
            icon={IconShieldExclamation}
            title="That code didn't match"
            description={
              <>
                Double-check the 6 digits from the SMS. You have{" "}
                <span className="font-medium">{ATTEMPTS_REMAINING} attempts remaining</span>{" "}
                before this code is locked.
              </>
            }
          />
        ) : null}

        {state === "locked" ? (
          <InlineAlert
            icon={IconLock}
            title="This code is locked"
            description="Too many incorrect attempts. Request a new code to try again — the previous one is retired for audit."
            actions={
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="bg-background"
              >
                <IconRefresh className="size-3.5" />
                Request new code
              </Button>
            }
          />
        ) : null}

        {state === "expired" ? (
          <InlineAlert
            icon={IconClockHour4}
            title="This code has expired"
            description="Codes are valid for 5 minutes after they're sent. Request a new one to continue."
            actions={
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="bg-background"
              >
                <IconRefresh className="size-3.5" />
                Request new code
              </Button>
            }
          />
        ) : null}

        {state === "daily-cap" ? (
          <InlineAlert
            icon={IconAlertHexagon}
            title="Daily limit reached"
            description="You've requested the maximum number of codes for this number today. Try again after midnight PKT."
          />
        ) : null}

        {!isTerminal && state !== "locked" && state !== "expired" ? (
          <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-sm">
            <div className="flex flex-col">
              <span className="font-medium text-foreground">Didn&apos;t get the code?</span>
              {state === "resend-cooldown" ? (
                <span className="text-xs text-muted-foreground">
                  Wait {RESEND_COOLDOWN_SECONDS} seconds before requesting a new code.
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Delivery can take up to a minute on some networks.
                </span>
              )}
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={state === "resend-cooldown" || state === "verifying"}
              className="shrink-0"
            >
              {state === "resend-cooldown"
                ? `Resend in ${RESEND_COOLDOWN_SECONDS}s`
                : "Resend code"}
            </Button>
          </div>
        ) : null}

        {isTerminal ? (
          <div className="flex items-center justify-center text-sm text-muted-foreground">
            <button
              type="button"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Sign out
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center text-sm text-muted-foreground">
            Need help?{" "}
            <a
              className="ms-1 font-medium text-foreground underline-offset-4 hover:underline"
              href="#"
            >
              Contact support
            </a>
          </div>
        )}
      </div>
    </motion.div>
  );
};

function getCodeCells(state: OtpEntryState): string[] {
  const empty = ["", "", "", "", "", ""];
  switch (state) {
    case "typing":
      return ["1", "2", "3", "", "", ""];
    case "verifying":
    case "wrong-code":
      return ["1", "2", "3", "4", "5", "6"];
    case "default":
    case "resend-cooldown":
    case "locked":
    case "expired":
    case "daily-cap":
    default:
      return empty;
  }
}
