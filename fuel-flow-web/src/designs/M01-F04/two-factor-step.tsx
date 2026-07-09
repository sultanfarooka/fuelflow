import { motion } from "motion/react";
import {
  IconAlertHexagon,
  IconArrowLeft,
  IconArrowRight,
  IconClockHour4,
  IconClockPause,
  IconLoader2,
  IconShieldExclamation,
  IconShieldLock,
} from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import {
  AuthShell,
  EASE_OUT_QUART,
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

type TwoFactorState =
  | "default"
  | "verifying"
  | "wrong-code"
  | "expired-token"
  | "recovery-mode"
  | "rate-limited";

const TWO_FACTOR_STATES: TwoFactorState[] = [
  "default",
  "verifying",
  "wrong-code",
  "expired-token",
  "recovery-mode",
  "rate-limited",
];

const STATE_BADGES: Record<TwoFactorState, string> = {
  default: "Default",
  verifying: "Verifying",
  "wrong-code": "401 · invalid_2fa_code",
  "expired-token": "410 · twoFactorToken_expired",
  "recovery-mode": "Recovery code fallback",
  "rate-limited": "429 · rate_limited",
};

const ATTEMPTS_REMAINING = 3;
const RATE_LIMIT_RETRY_AFTER_SEC = 132;

// Two-step stepper is only used on the 2FA path — password step already done.
const STEPS = [
  { id: 1, label: "Password" },
  { id: 2, label: "Verify" },
];

type DesignProps = {
  focusVariantId?: string;
  fullscreen?: boolean;
};

const TwoFactorStepDesign = ({
  focusVariantId,
  fullscreen,
}: DesignProps = {}) => {
  const viewports: Viewport[] = ["desktop", "tablet", "mobile"];

  const allVariants = viewports.flatMap((viewport) =>
    TWO_FACTOR_STATES.map((state) => ({
      viewport,
      state,
      id: `${viewport}-${state}`,
    })),
  );
  const focused = focusVariantId
    ? allVariants.find((v) => v.id === focusVariantId)
    : null;

  if (fullscreen && focused) {
    return (
      <AuthShell viewport={focused.viewport} fullscreen>
        <TwoFactorColumn
          viewport={focused.viewport}
          state={focused.state}
          fullscreen
        />
      </AuthShell>
    );
  }

  const description =
    "Step 2 of the 2FA path — 6-digit TOTP from an authenticator app, with a recovery-code fallback and terminal expired / rate-limited errors.";

  if (focused) {
    return (
      <div className="min-h-screen bg-muted/30 px-4 py-10 text-foreground">
        <div className="mx-auto flex max-w-[1360px] flex-col items-center gap-6">
          <PreviewHeader
            featureId="M01-F04"
            lifecycle="spec-locked"
            title="Login — 2FA step"
            description={description}
          />
          <ViewportFrame
            viewport={focused.viewport}
            stateLabel={STATE_BADGES[focused.state]}
            variantId={focused.id}
            solo
          >
            <AuthShell viewport={focused.viewport}>
              <TwoFactorColumn
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
          featureId="M01-F04"
          lifecycle="spec-locked"
          title="Login — 2FA step"
          description={description}
        />
        {viewports.map((viewport) => (
          <section key={viewport} className="flex flex-col gap-6">
            <ViewportSectionHeading viewport={viewport} />
            <div className="flex flex-col items-center gap-8">
              {TWO_FACTOR_STATES.map((state) => (
                <ViewportFrame
                  key={`${viewport}-${state}`}
                  viewport={viewport}
                  stateLabel={STATE_BADGES[state]}
                  variantId={`${viewport}-${state}`}
                >
                  <AuthShell viewport={viewport}>
                    <TwoFactorColumn viewport={viewport} state={state} />
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

export default TwoFactorStepDesign;

const TwoFactorColumn = ({
  viewport,
  state,
  fullscreen = false,
}: {
  viewport: Viewport;
  state: TwoFactorState;
  fullscreen?: boolean;
}) => {
  const isMobile = viewport === "mobile";
  const isTablet = viewport === "tablet";

  const isRecovery = state === "recovery-mode";
  const isVerifying = state === "verifying";
  const isTerminal = state === "expired-token";
  const isRateLimited = state === "rate-limited";
  const cellsInvalid = state === "wrong-code";
  const cellsDisabled =
    isVerifying || isTerminal || isRateLimited || state === "wrong-code";
  const codeCells = getCodeCells(state);
  const verifyDisabled =
    isVerifying || isTerminal || isRateLimited || state === "default";

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
          !isMobile && (isTablet ? "max-w-[420px]" : "max-w-md"),
        )}
      >
        <div>
          {isMobile ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Step 2 of 2 · Verify
            </span>
          ) : (
            <Stepper steps={STEPS} currentStep={2} />
          )}
        </div>

        <div className="flex flex-col gap-3">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
            <IconShieldLock className="size-3" />
            Two-factor authentication
          </div>
          <div className="flex flex-col gap-1.5">
            <h1
              className={cn(
                "font-semibold tracking-tight",
                isMobile ? "text-xl" : "text-2xl",
              )}
            >
              {isRecovery
                ? "Enter a recovery code"
                : "Enter your 2FA code"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isRecovery
                ? "Use one of the one-time recovery codes you saved when you set up 2FA. Each code works once."
                : "Open your authenticator app and enter the 6-digit code shown for Fuel Flow."}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {isVerifying ? (
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <IconLoader2 className="size-4 animate-spin" />
              {isRecovery ? "Checking recovery code…" : "Verifying code…"}
            </div>
          ) : null}

          {isRecovery ? (
            <Field>
              <FieldLabel htmlFor="recovery-code">Recovery code</FieldLabel>
              <Input
                id="recovery-code"
                name="recovery-code"
                type="text"
                autoComplete="one-time-code"
                inputMode="text"
                placeholder="e.g. 4h9k-2mzq-x7pn"
                disabled={cellsDisabled}
                className={cn(
                  "font-mono tracking-wider",
                  INPUT_FOCUS_RING,
                )}
              />
              <FieldDescription>
                Enter the code including the hyphens. Codes are case-insensitive.
              </FieldDescription>
            </Field>
          ) : (
            <motion.div
              key={cellsInvalid ? "shake" : "idle"}
              animate={cellsInvalid ? { x: SHAKE_KEYFRAMES } : { x: 0 }}
              transition={{ duration: 0.45, ease: "easeInOut" }}
              className={cn(
                "grid grid-cols-6",
                isMobile ? "gap-1.5" : "gap-2",
              )}
              role="group"
              aria-label="Two-factor code"
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
                    "w-full min-w-0 text-center font-semibold tabular-nums",
                    isMobile ? "h-11 px-0 text-lg" : "h-14 text-2xl",
                    INPUT_FOCUS_RING,
                    cellsInvalid && "border-destructive text-destructive",
                  )}
                />
              ))}
            </motion.div>
          )}

          <div className="min-h-[20px] text-xs text-muted-foreground">
            {state === "default" ? (
              <span>
                We'll verify automatically as soon as you enter all 6 digits.
              </span>
            ) : null}
            {state === "wrong-code" ? (
              <span className="font-medium text-destructive">
                Invalid code.{" "}
                <span className="font-normal">
                  {ATTEMPTS_REMAINING} attempts remaining before this session
                  locks.
                </span>
              </span>
            ) : null}
          </div>
        </div>

        {state === "wrong-code" ? (
          <InlineAlert
            icon={IconShieldExclamation}
            title="That code didn't match"
            description={
              <>
                Codes rotate every 30 seconds — the one you entered may have
                just expired. Try the current code from your authenticator app.
              </>
            }
          />
        ) : null}

        {state === "expired-token" ? (
          <InlineAlert
            icon={IconClockPause}
            title="Session expired"
            description="Your 2FA window has expired for security. Sign in with your password again to get a fresh code."
            actions={
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="bg-background"
              >
                <IconArrowLeft className="size-3.5" />
                Back to sign in
              </Button>
            }
          />
        ) : null}

        {state === "rate-limited" ? (
          <InlineAlert
            icon={IconClockHour4}
            title="Too many attempts"
            description={
              <>
                For safety, further attempts are paused. Try again in{" "}
                <span className="font-medium tabular-nums">
                  {formatCountdown(RATE_LIMIT_RETRY_AFTER_SEC)}
                </span>
                .
              </>
            }
          />
        ) : null}

        {!isTerminal ? (
          <div>
            <motion.div
              whileHover={!verifyDisabled ? { y: -1 } : undefined}
              whileTap={!verifyDisabled ? { scale: 0.98 } : undefined}
              transition={{ duration: 0.15, ease: EASE_OUT_QUART }}
            >
              <Button
                type="button"
                size="lg"
                disabled={verifyDisabled}
                className="relative h-11 w-full overflow-hidden"
              >
                {isVerifying && (
                  <motion.span
                    aria-hidden
                    className="absolute inset-y-0 w-1/3 bg-primary-foreground/20"
                    initial={{ left: "-40%" }}
                    animate={{ left: "110%" }}
                    transition={{
                      duration: 1.2,
                      ease: "linear",
                      repeat: Infinity,
                    }}
                  />
                )}
                <span className="relative inline-flex items-center gap-2">
                  {isVerifying ? (
                    <>
                      <IconLoader2 className="size-4 animate-spin" />
                      Verifying…
                    </>
                  ) : (
                    <>
                      Verify
                      <IconArrowRight className="size-4" />
                    </>
                  )}
                </span>
              </Button>
            </motion.div>
          </div>
        ) : null}

        {!isTerminal ? (
          <div className="flex flex-col gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm">
            <div
              className={cn(
                "gap-3",
                isMobile
                  ? "flex flex-col"
                  : "flex items-center justify-between",
              )}
            >
              <div className="flex items-start gap-2">
                <IconAlertHexagon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {isRecovery
                    ? "Lost your recovery codes too? Contact your Owner to help you back in."
                    : "Don't have your device with you?"}
                </span>
              </div>
              <Button
                type="button"
                size="sm"
                variant={isMobile ? "outline" : "ghost"}
                disabled={isVerifying || isRateLimited}
                className={cn(
                  "shrink-0",
                  isMobile && "h-11 w-full bg-background",
                )}
              >
                {isRecovery ? "Use authenticator instead" : "Use a recovery code"}
              </Button>
            </div>
          </div>
        ) : null}

        {isMobile ? (
          <p className="text-center text-sm text-muted-foreground">
            <a
              className="font-medium text-foreground underline-offset-4 hover:underline"
              href="#"
            >
              Cancel and sign in again
            </a>
          </p>
        ) : (
          <div className="flex items-center justify-center text-sm text-muted-foreground">
            <a
              className="ms-1 font-medium text-foreground underline-offset-4 hover:underline"
              href="#"
            >
              Cancel and sign in again
            </a>
          </div>
        )}
      </div>
    </motion.div>
  );
};

function getCodeCells(state: TwoFactorState): string[] {
  const empty = ["", "", "", "", "", ""];
  switch (state) {
    case "verifying":
    case "wrong-code":
      return ["4", "1", "9", "7", "2", "5"];
    case "default":
    case "expired-token":
    case "rate-limited":
    case "recovery-mode":
    default:
      return empty;
  }
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
