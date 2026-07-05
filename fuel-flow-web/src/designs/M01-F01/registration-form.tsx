import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  IconAlertHexagon,
  IconArrowRight,
  IconClockHour4,
  IconLoader2,
} from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import {
  AuthShell,
  DEFAULT_STATE_BADGES,
  EASE_OUT_QUART,
  FORM_STATES,
  INPUT_FOCUS_RING,
  InlineAlert,
  PasswordChecklist,
  PasswordInput,
  PreviewHeader,
  SHAKE_KEYFRAMES,
  Stepper,
  ViewportFrame,
  ViewportSectionHeading,
  alertVariants,
  columnVariants,
  type FormState,
  type Viewport,
} from "@/designs/_shared";

// Override the "api-409" label — for M01-F01 the 409 specifically means
// duplicate phone.
const STATE_BADGES: Record<FormState, string> = {
  ...DEFAULT_STATE_BADGES,
  "api-409": "API error · 409 duplicate phone",
};

const SAMPLE_VALUES = {
  firstName: "Ayesha",
  lastName: "Khan",
  phone: "03001234567",
  email: "ayesha.khan@example.pk",
  password: "Sunrise2026",
  confirmPassword: "Sunrise2026",
};

const ERROR_VALUES = {
  firstName: "Ayesha",
  lastName: "Khan",
  phone: "0301234",
  email: "not-an-email",
  password: "abcd",
  confirmPassword: "different",
};

const EMPTY_VALUES = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const TC_VERSION = "2026-06";

const STEPS = [
  { id: 1, label: "Account" },
  { id: 2, label: "Verify phone" },
];

type DesignProps = {
  focusVariantId?: string;
  fullscreen?: boolean;
};

const RegistrationFormDesign = ({ focusVariantId, fullscreen }: DesignProps = {}) => {
  const viewports: Viewport[] = ["desktop", "tablet", "mobile"];

  const allVariants = viewports.flatMap((viewport) =>
    FORM_STATES.map((state) => ({ viewport, state, id: `${viewport}-${state}` })),
  );
  const focused = focusVariantId
    ? allVariants.find((v) => v.id === focusVariantId)
    : null;

  if (fullscreen && focused) {
    return (
      <AuthShell viewport={focused.viewport} fullscreen>
        <FormColumn viewport={focused.viewport} state={focused.state} fullscreen />
      </AuthShell>
    );
  }

  const description =
    "Side brand panel + paired-field form on desktop/tablet; vertical stack with mobile brand header + menu sheet.";

  if (focused) {
    return (
      <div className="min-h-screen bg-muted/30 px-4 py-10 text-foreground">
        <div className="mx-auto flex max-w-[1360px] flex-col items-center gap-6">
          <PreviewHeader
            featureId="M01-F01"
            lifecycle="drafting"
            title="Self-Service Registration"
            description={description}
          />
          <ViewportFrame
            viewport={focused.viewport}
            stateLabel={STATE_BADGES[focused.state]}
            variantId={focused.id}
            solo
          >
            <AuthShell viewport={focused.viewport}>
              <FormColumn viewport={focused.viewport} state={focused.state} />
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
          featureId="M01-F01"
          lifecycle="drafting"
          title="Self-Service Registration"
          description={description}
        />

        {viewports.map((viewport) => (
          <section key={viewport} className="flex flex-col gap-6">
            <ViewportSectionHeading viewport={viewport} />
            <div className="flex flex-col items-center gap-8">
              {FORM_STATES.map((state) => (
                <ViewportFrame
                  key={`${viewport}-${state}`}
                  viewport={viewport}
                  stateLabel={STATE_BADGES[state]}
                  variantId={`${viewport}-${state}`}
                >
                  <AuthShell viewport={viewport}>
                    <FormColumn viewport={viewport} state={state} />
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

export default RegistrationFormDesign;

const FormColumn = ({
  viewport,
  state,
  fullscreen = false,
}: {
  viewport: Viewport;
  state: FormState;
  fullscreen?: boolean;
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const isMobile = viewport === "mobile";
  const isTablet = viewport === "tablet";

  const values =
    state === "default" || state === "loading" || state === "api-409" || state === "api-429"
      ? SAMPLE_VALUES
      : state === "error"
        ? ERROR_VALUES
        : EMPTY_VALUES;

  const showFieldErrors = state === "error";
  const showApiError = state === "api-409" || state === "api-429";
  const isLoading = state === "loading";
  const tcChecked = state !== "empty";

  const phoneError = showFieldErrors
    ? "Mobile number must be 11 digits starting with 03 (e.g. 03001234567)."
    : undefined;
  const emailError = showFieldErrors && values.email
    ? "Enter a valid email address."
    : undefined;
  const passwordError = showFieldErrors
    ? "At least 6 characters, including one digit."
    : undefined;
  const confirmError =
    showFieldErrors && values.confirmPassword !== values.password
      ? "Passwords don't match."
      : undefined;

  const fieldRowClass = isMobile ? "flex flex-col gap-5" : "grid grid-cols-2 items-start gap-4";
  const namesRowClass = isMobile ? "flex flex-col gap-5" : "grid grid-cols-2 gap-4";

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
          <Stepper steps={STEPS} currentStep={1} />
        </div>

        <div className="flex flex-col gap-1.5">
          <h1
            className={cn(
              "font-semibold tracking-tight",
              isMobile ? "text-xl" : "text-2xl",
            )}
          >
            Create your account
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign up with your Pakistani mobile number. We&apos;ll send a 6-digit code to
            verify it.
          </p>
        </div>

        <form className="flex flex-col gap-5" noValidate>
          <div className={namesRowClass}>
            <Field>
              <FieldLabel htmlFor="firstName">First name</FieldLabel>
              <Input
                id="firstName"
                name="firstName"
                autoComplete="given-name"
                placeholder="Ayesha"
                defaultValue={values.firstName}
                disabled={isLoading}
                className={INPUT_FOCUS_RING}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="lastName">Last name</FieldLabel>
              <Input
                id="lastName"
                name="lastName"
                autoComplete="family-name"
                placeholder="Khan"
                defaultValue={values.lastName}
                disabled={isLoading}
                className={INPUT_FOCUS_RING}
              />
            </Field>
          </div>

          <div className={fieldRowClass}>
            <motion.div
              animate={phoneError ? { x: SHAKE_KEYFRAMES } : { x: 0 }}
              transition={{ duration: 0.45, ease: "easeInOut" }}
            >
              <Field data-invalid={!!phoneError || undefined}>
                <FieldLabel htmlFor="phone">Mobile number</FieldLabel>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="0300 1234567"
                  defaultValue={values.phone}
                  disabled={isLoading}
                  aria-invalid={!!phoneError || undefined}
                  maxLength={11}
                  className={INPUT_FOCUS_RING}
                />
                {phoneError ? (
                  <FieldError>{phoneError}</FieldError>
                ) : (
                  <FieldDescription>11 digits starting with 03.</FieldDescription>
                )}
              </Field>
            </motion.div>
            <motion.div
              animate={emailError ? { x: SHAKE_KEYFRAMES } : { x: 0 }}
              transition={{ duration: 0.45, ease: "easeInOut" }}
            >
              <Field data-invalid={!!emailError || undefined}>
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <span className="text-xs text-muted-foreground">Optional</span>
                </div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.pk"
                  defaultValue={values.email}
                  disabled={isLoading}
                  aria-invalid={!!emailError || undefined}
                  className={INPUT_FOCUS_RING}
                />
                {emailError ? (
                  <FieldError>{emailError}</FieldError>
                ) : (
                  <FieldDescription>For account recovery.</FieldDescription>
                )}
              </Field>
            </motion.div>
          </div>

          <div className={fieldRowClass}>
            <motion.div
              animate={passwordError ? { x: SHAKE_KEYFRAMES } : { x: 0 }}
              transition={{ duration: 0.45, ease: "easeInOut" }}
            >
              <Field data-invalid={!!passwordError || undefined}>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <PasswordInput
                  id="password"
                  name="password"
                  autoComplete="new-password"
                  placeholder="At least 6 chars, 1 digit"
                  defaultValue={values.password}
                  disabled={isLoading}
                  aria-invalid={!!passwordError || undefined}
                  visible={showPassword}
                  onToggle={() => setShowPassword((s) => !s)}
                />
                {passwordError ? (
                  <FieldError>{passwordError}</FieldError>
                ) : (
                  <PasswordChecklist value={values.password} />
                )}
              </Field>
            </motion.div>
            <motion.div
              animate={confirmError ? { x: SHAKE_KEYFRAMES } : { x: 0 }}
              transition={{ duration: 0.45, ease: "easeInOut" }}
            >
              <Field data-invalid={!!confirmError || undefined}>
                <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
                <PasswordInput
                  id="confirmPassword"
                  name="confirmPassword"
                  autoComplete="new-password"
                  placeholder="Re-enter password"
                  defaultValue={values.confirmPassword}
                  disabled={isLoading}
                  aria-invalid={!!confirmError || undefined}
                  visible={showConfirm}
                  onToggle={() => setShowConfirm((s) => !s)}
                />
                {confirmError ? (
                  <FieldError>{confirmError}</FieldError>
                ) : (
                  <FieldDescription>Re-enter to confirm.</FieldDescription>
                )}
              </Field>
            </motion.div>
          </div>

          <label htmlFor="tc" className="flex items-start gap-3 text-sm text-foreground">
            <Checkbox
              id="tc"
              defaultChecked={tcChecked}
              disabled={isLoading}
              className="mt-0.5"
            />
            <span className="leading-relaxed">
              I agree to the{" "}
              <a
                className="font-medium text-primary underline-offset-4 hover:underline"
                href="#"
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                className="font-medium text-primary underline-offset-4 hover:underline"
                href="#"
              >
                Privacy Policy
              </a>
              <span className="ms-1 text-xs text-muted-foreground">· v{TC_VERSION}</span>
            </span>
          </label>

          <AnimatePresence initial={false} mode="wait">
            {showApiError ? (
              <motion.div
                key={state}
                variants={alertVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="overflow-hidden"
              >
                {state === "api-409" ? (
                  <InlineAlert
                    icon={IconAlertHexagon}
                    title="This phone number is already registered"
                    description={
                      <>
                        An account already exists for {SAMPLE_VALUES.phone}. Sign in with
                        this number, or recover your password if you&apos;ve forgotten it.
                      </>
                    }
                    actions={
                      <>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="bg-background"
                        >
                          Sign in with this number
                        </Button>
                        <Button type="button" size="sm" variant="ghost">
                          Recover password
                        </Button>
                      </>
                    }
                  />
                ) : (
                  <InlineAlert
                    icon={IconClockHour4}
                    title="Too many sign-up attempts"
                    description="You've hit the per-IP limit. Please wait about 15 minutes before trying again, or sign in if you already have an account."
                  />
                )}
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div>
            <motion.div
              whileHover={!isLoading && !showApiError ? { y: -1 } : undefined}
              whileTap={!isLoading && !showApiError ? { scale: 0.98 } : undefined}
              transition={{ duration: 0.15, ease: EASE_OUT_QUART }}
            >
              <Button
                type="button"
                size="lg"
                disabled={isLoading || showApiError}
                className="relative h-11 w-full overflow-hidden"
              >
                {isLoading && (
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
                  {isLoading ? (
                    <>
                      <IconLoader2 className="size-4 animate-spin" />
                      Creating your account…
                    </>
                  ) : (
                    <>
                      Continue to phone verification
                      <IconArrowRight className="size-4" />
                    </>
                  )}
                </span>
              </Button>
            </motion.div>
          </div>

          <div className="flex items-center justify-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <a
              className="ms-1 font-medium text-foreground underline-offset-4 hover:underline"
              href="#"
            >
              Sign in
            </a>
          </div>
        </form>
      </div>
    </motion.div>
  );
};
