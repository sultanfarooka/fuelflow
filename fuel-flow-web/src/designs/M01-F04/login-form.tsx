import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  IconAlertHexagon,
  IconArrowRight,
  IconClockHour4,
  IconInfoCircle,
  IconLoader2,
  IconLock,
  IconShieldCheck,
} from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import {
  AuthShell,
  EASE_OUT_QUART,
  INPUT_FOCUS_RING,
  InlineAlert,
  PasswordInput,
  PreviewHeader,
  ViewportFrame,
  ViewportSectionHeading,
  alertVariants,
  columnVariants,
  type Viewport,
} from "@/designs/_shared";

// M01-F04 login form has its own state enum — the shared FormState six-tuple
// doesn't cover generic-error / locked / rate-limited / tc-required.
type LoginState =
  | "default"
  | "password-revealed"
  | "submitting"
  | "invalid-credentials"
  | "locked"
  | "rate-limited"
  | "tc-required";

const LOGIN_STATES: LoginState[] = [
  "default",
  "password-revealed",
  "submitting",
  "invalid-credentials",
  "locked",
  "rate-limited",
  "tc-required",
];

const STATE_BADGES: Record<LoginState, string> = {
  default: "Default",
  "password-revealed": "Password revealed",
  submitting: "Submitting (200 pending)",
  "invalid-credentials": "401 · invalid_credentials",
  locked: "423 · account_locked",
  "rate-limited": "429 · rate_limited",
  "tc-required": "200 · tcAcceptanceRequired",
};

// Module-plan §2 shape.
const SAMPLE_USER = {
  phoneNumber: "03001234567",
  password: "Sunrise2026",
};
const LOCKED_RETRY_AFTER_SEC = 87;
const RATE_LIMIT_RETRY_AFTER_SEC = 156;
const TC_VERSION = "2026-06";

const TC_SECTIONS: { title: string; body: string }[] = [
  {
    title: "1. Scope of service",
    body: "Fuel Flow provides multi-tenant filling-station management software (inventory, shift ops, credit, OGRA pricing, reports) for licensed operators in Pakistan.",
  },
  {
    title: "2. Data ownership",
    body: "You retain all rights to your operational data. We process it solely to deliver your subscribed services and maintain rolling backups per your plan's retention window.",
  },
  {
    title: "3. Acceptable use",
    body: "The service is for lawful commercial operation of a filling station. Automated scraping, resale of aggregated pricing data, and circumvention of subscription limits are prohibited.",
  },
  {
    title: "4. Changes to these terms",
    body: "We may update these terms as regulations, integrations, or scope evolve. You'll be prompted here before further use whenever a material change is published.",
  },
];

type DesignProps = {
  focusVariantId?: string;
  fullscreen?: boolean;
};

const LoginFormDesign = ({ focusVariantId, fullscreen }: DesignProps = {}) => {
  const viewports: Viewport[] = ["desktop", "tablet", "mobile"];

  const allVariants = viewports.flatMap((viewport) =>
    LOGIN_STATES.map((state) => ({
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
        <LoginColumn
          viewport={focused.viewport}
          state={focused.state}
          fullscreen
        />
        {focused.state === "tc-required" ? (
          <TcBlockingModal viewport={focused.viewport} />
        ) : null}
      </AuthShell>
    );
  }

  const description =
    "Anonymous sign-in. Single identifier field (phone/email auto-detect) + password with reveal + Remember-device + generic-error / locked / rate-limited / T&C-required overlay states.";

  if (focused) {
    return (
      <div className="min-h-screen bg-muted/30 px-4 py-10 text-foreground">
        <div className="mx-auto flex max-w-[1360px] flex-col items-center gap-6">
          <PreviewHeader
            featureId="M01-F04"
            lifecycle="spec-locked"
            title="Login"
            description={description}
          />
          <ViewportFrame
            viewport={focused.viewport}
            stateLabel={STATE_BADGES[focused.state]}
            variantId={focused.id}
            solo
          >
            <div className="relative">
              <AuthShell viewport={focused.viewport}>
                <LoginColumn
                  viewport={focused.viewport}
                  state={focused.state}
                />
              </AuthShell>
              {focused.state === "tc-required" ? (
                <TcBlockingModal viewport={focused.viewport} />
              ) : null}
            </div>
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
          title="Login"
          description={description}
        />
        {viewports.map((viewport) => (
          <section key={viewport} className="flex flex-col gap-6">
            <ViewportSectionHeading viewport={viewport} />
            <div className="flex flex-col items-center gap-8">
              {LOGIN_STATES.map((state) => (
                <ViewportFrame
                  key={`${viewport}-${state}`}
                  viewport={viewport}
                  stateLabel={STATE_BADGES[state]}
                  variantId={`${viewport}-${state}`}
                >
                  <div className="relative">
                    <AuthShell viewport={viewport}>
                      <LoginColumn viewport={viewport} state={state} />
                    </AuthShell>
                    {state === "tc-required" ? (
                      <TcBlockingModal viewport={viewport} />
                    ) : null}
                  </div>
                </ViewportFrame>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

export default LoginFormDesign;

const LoginColumn = ({
  viewport,
  state,
  fullscreen = false,
}: {
  viewport: Viewport;
  state: LoginState;
  fullscreen?: boolean;
}) => {
  const isMobile = viewport === "mobile";
  const isTablet = viewport === "tablet";

  const showPassword = state === "password-revealed";
  // Toggle is presentational only in this preview — state drives it.
  const [, setShowPassword] = useState(false);

  const showsCredentials =
    state !== "default" && state !== "rate-limited" && state !== "locked";
  const identifierValue = showsCredentials ? SAMPLE_USER.phoneNumber : "";
  const passwordValue = showsCredentials ? SAMPLE_USER.password : "";

  const isSubmitting = state === "submitting";
  const isDimmed = state === "tc-required";
  const isDisabled = isSubmitting || state === "locked" || isDimmed;
  const isInvalidCreds = state === "invalid-credentials";

  const inlineAlert = useMemo(
    () => renderInlineAlert(state),
    [state],
  );

  // Detect inputMode on @ per OQ7 leaning — presentational.
  const identifierInputMode = identifierValue.includes("@")
    ? "email"
    : "numeric";

  return (
    <motion.div
      variants={columnVariants}
      className={cn(
        "flex justify-center",
        fullscreen && !isMobile ? "items-center" : "items-start",
        isMobile ? "px-4 py-8" : isTablet ? "px-8 py-10" : "px-12 py-14",
        isDimmed && "pointer-events-none opacity-60",
      )}
      aria-hidden={isDimmed || undefined}
    >
      <div
        className={cn(
          "flex w-full flex-col",
          isMobile ? "max-w-full gap-6" : "gap-7",
          !isMobile && (isTablet ? "max-w-[420px]" : "max-w-md"),
        )}
      >
        <div className="flex flex-col gap-1.5">
          <h1
            className={cn(
              "font-semibold tracking-tight",
              isMobile ? "text-xl" : "text-2xl",
            )}
          >
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to your Fuel Flow account with your phone number or email.
          </p>
        </div>

        <form className="flex flex-col gap-5" noValidate>
          <Field data-invalid={isInvalidCreds || undefined}>
            <FieldLabel htmlFor="identifier">Phone or email</FieldLabel>
            <Input
              id="identifier"
              name="identifier"
              type="text"
              inputMode={identifierInputMode}
              autoComplete="username"
              placeholder="03001234567 or you@example.pk"
              defaultValue={identifierValue}
              disabled={isDisabled}
              aria-invalid={isInvalidCreds || undefined}
              className={cn(
                INPUT_FOCUS_RING,
                isInvalidCreds &&
                  "border-destructive focus-visible:border-destructive",
              )}
            />
            <FieldDescription>
              Pakistani mobile (03…) or a verified email address.
            </FieldDescription>
          </Field>

          <Field data-invalid={isInvalidCreds || undefined}>
            {isMobile ? (
              <FieldLabel htmlFor="password">Password</FieldLabel>
            ) : (
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <a
                  href="#"
                  className={cn(
                    "text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline",
                    isDisabled && "pointer-events-none opacity-60",
                  )}
                >
                  Forgot password?
                </a>
              </div>
            )}
            <PasswordInput
              id="password"
              name="password"
              autoComplete="current-password"
              placeholder="Your password"
              defaultValue={passwordValue}
              disabled={isDisabled}
              aria-invalid={isInvalidCreds || undefined}
              visible={showPassword}
              onToggle={() => setShowPassword((s) => !s)}
              className={cn(
                isInvalidCreds &&
                  "border-destructive focus-visible:border-destructive",
              )}
            />
          </Field>

          <label
            htmlFor="remember-device"
            className={cn(
              "flex items-start gap-3 text-sm text-foreground",
              isDisabled && "pointer-events-none opacity-60",
            )}
          >
            <Checkbox
              id="remember-device"
              defaultChecked={false}
              disabled={isDisabled}
              className="mt-0.5"
            />
            <span className="leading-relaxed">
              Remember this device for 90 days
              <span className="ms-1 text-xs text-muted-foreground">
                · trusted devices skip 2FA for the next visit
              </span>
            </span>
          </label>

          {isMobile ? (
            <a
              href="#"
              className={cn(
                "-mt-1 inline-flex min-h-11 items-center text-sm font-medium text-foreground underline-offset-4 hover:underline",
                isDisabled && "pointer-events-none opacity-60",
              )}
            >
              Forgot password?
            </a>
          ) : null}

          <AnimatePresence initial={false} mode="wait">
            {inlineAlert ? (
              <motion.div
                key={state}
                variants={alertVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="overflow-hidden"
              >
                {inlineAlert}
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div>
            <motion.div
              whileHover={!isDisabled ? { y: -1 } : undefined}
              whileTap={!isDisabled ? { scale: 0.98 } : undefined}
              transition={{ duration: 0.15, ease: EASE_OUT_QUART }}
            >
              <Button
                type="button"
                size="lg"
                disabled={isDisabled}
                className="relative h-11 w-full overflow-hidden"
              >
                {isSubmitting && (
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
                  {isSubmitting ? (
                    <>
                      <IconLoader2 className="size-4 animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    <>
                      Sign in
                      <IconArrowRight className="size-4" />
                    </>
                  )}
                </span>
              </Button>
            </motion.div>
          </div>

          {isMobile ? (
            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <a
                className="font-medium text-foreground underline-offset-4 hover:underline"
                href="#"
              >
                Sign up
              </a>
            </p>
          ) : (
            <div className="flex items-center justify-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <a
                className="ms-1 font-medium text-foreground underline-offset-4 hover:underline"
                href="#"
              >
                Sign up
              </a>
            </div>
          )}
        </form>
      </div>
    </motion.div>
  );
};

// Per plan OQ5 leaning: fully generic copy — no hint about which field was
// wrong, or whether the user exists / is verified. Same string for wrong-pwd /
// unknown-user / unverified-phone / unverified-email.
function renderInlineAlert(state: LoginState): React.ReactNode {
  if (state === "invalid-credentials") {
    return (
      <InlineAlert
        icon={IconAlertHexagon}
        title="Sign-in failed"
        description="Check your credentials and try again. If you've forgotten your password, use the recovery link above."
      />
    );
  }
  if (state === "locked") {
    return (
      <InlineAlert
        icon={IconLock}
        title="Account temporarily locked"
        description={
          <>
            Too many failed sign-in attempts. Try again in{" "}
            <span className="font-medium tabular-nums">
              {formatCountdown(LOCKED_RETRY_AFTER_SEC)}
            </span>
            , or reset your password to unlock immediately.
          </>
        }
        actions={
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="bg-background"
          >
            <IconShieldCheck className="size-3.5" />
            Forgot password?
          </Button>
        }
      />
    );
  }
  if (state === "rate-limited") {
    return (
      <InlineAlert
        icon={IconClockHour4}
        title="Too many attempts"
        description={
          <>
            We're pausing sign-in from this network to keep accounts safe. Try
            again in{" "}
            <span className="font-medium tabular-nums">
              {formatCountdown(RATE_LIMIT_RETRY_AFTER_SEC)}
            </span>
            .
          </>
        }
      />
    );
  }
  return null;
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// F16 owns the real BlockingLegalModal (module-plan §3). Mocked inline here so
// M01-F04 can show its own tc-required variant — swap for the real component
// when F16 is designed.
const TcBlockingModal = ({ viewport }: { viewport: Viewport }) => {
  const isMobile = viewport === "mobile";
  return (
    <motion.div
      className={cn(
        "absolute inset-0 z-40 flex items-center justify-center bg-foreground/50 backdrop-blur-sm",
        isMobile ? "px-4 py-6" : "px-6 py-8",
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: EASE_OUT_QUART }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tc-modal-title"
    >
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: EASE_OUT_QUART }}
        className={cn(
          "flex w-full flex-col rounded-2xl border border-border bg-card shadow-2xl",
          isMobile ? "max-h-[calc(100%-1rem)] gap-4 p-5" : "max-w-lg gap-5 p-6",
        )}
      >
        <div className="flex flex-col gap-1.5">
          <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            <IconInfoCircle className="size-3" />
            Updated · v{TC_VERSION}
          </div>
          <h2
            id="tc-modal-title"
            className={cn(
              "font-semibold tracking-tight",
              isMobile ? "text-base" : "text-lg",
            )}
          >
            Please review our updated Terms
          </h2>
          <p className="text-sm text-muted-foreground">
            We&apos;ve updated the Terms of Service and Privacy Policy since
            your last visit. Please read the changes and accept to continue
            signing in.
          </p>
        </div>
        <div
          className={cn(
            "relative flex flex-1 flex-col gap-3 overflow-y-auto rounded-lg border border-border bg-background p-4 text-sm text-foreground",
            isMobile ? "max-h-48" : "max-h-56",
          )}
        >
          {TC_SECTIONS.map((section) => (
            <div key={section.title} className="flex flex-col gap-1">
              <p className="font-medium">{section.title}</p>
              <p className="text-muted-foreground">{section.body}</p>
            </div>
          ))}
        </div>
        {isMobile ? (
          <p className="text-xs text-muted-foreground">
            By continuing, you agree to the current{" "}
            <a
              href="#"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Terms
            </a>{" "}
            and{" "}
            <a
              href="#"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Privacy Policy
            </a>
            .
          </p>
        ) : (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              By continuing, you agree to the current{" "}
              <a
                href="#"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Terms
              </a>{" "}
              and{" "}
              <a
                href="#"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Privacy Policy
              </a>
              .
            </span>
          </div>
        )}
        <Button type="button" size="lg" className="h-11 w-full">
          Accept and continue
          <IconArrowRight className="size-4" />
        </Button>
      </motion.div>
    </motion.div>
  );
};
