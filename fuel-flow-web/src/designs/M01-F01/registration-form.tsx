import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { IconArrowRight, IconLoader2, IconX } from "@tabler/icons-react";

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
  INPUT_FOCUS_RING,
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
  type PasswordRule,
  type Viewport,
} from "@/designs/_shared";

import {
  RegistrationAlert,
  type RegistrationAlertKind,
} from "./registration-alerts";

// The shared six-state union is inherited by M01-F02 and M01-F04, so F01's
// extra states stay local: a 400 carrying an array of F14 rule codes, and the
// three distinct 409s the generic "api-409" used to flatten together.
type FeatureState =
  | FormState
  | "password-policy-error"
  | "api-409-phone-verified"
  | "api-409-phone-resumable"
  | "api-409-email";

const ALL_STATES: FeatureState[] = [
  "default",
  "empty",
  "loading",
  "error",
  "password-policy-error",
  "api-409-phone-verified",
  "api-409-phone-resumable",
  "api-409-email",
  "api-429",
];

// Which states a viewport renders. All three now carry the full matrix; the
// per-viewport indirection stays because it is how a new state gets promoted
// one composition at a time instead of landing on all three unreviewed.
const STATES_BY_VIEWPORT: Record<Viewport, FeatureState[]> = {
  desktop: ALL_STATES,
  tablet: ALL_STATES,
  mobile: ALL_STATES,
};

// Deliberately independent of STATES_BY_VIEWPORT. Carrying every state does not
// imply room to display the whole policy up-front: at 390px four permanently
// visible rules cost ~60px mid-form, so mobile keeps progressive reveal and
// surfaces server-rejected rules through the field-error branch instead.
const PASSWORD_CHECKLIST_MODE_BY_VIEWPORT: Record<
  Viewport,
  "satisfied" | "all"
> = {
  desktop: "all",
  tablet: "all",
  mobile: "satisfied",
};

const STATE_BADGES: Record<FeatureState, string> = {
  ...DEFAULT_STATE_BADGES,
  "api-409": "API error · 409 duplicate phone",
  "password-policy-error": "400 · password policy (F14 rule array)",
  "api-409-phone-verified": "409 · duplicate phone, verified (AC2)",
  "api-409-phone-resumable": "409 · duplicate phone, resumable (AC10 · R11)",
  "api-409-email": "409 · duplicate email (AC3)",
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

const POLICY_ERROR_VALUES = {
  firstName: "Ayesha",
  lastName: "Khan",
  phone: "03001234567",
  email: "ayesha.khan@example.pk",
  password: "Ayesha123",
  confirmPassword: "Ayesha123",
};

const EMPTY_VALUES = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  password: "",
  confirmPassword: "",
};

// F14's default profile (≥6 chars, ≥1 digit) plus its two always-on bans. Rule
// ids are the F14 rule codes so a server response maps straight onto the list.
const BANNED_PASSWORDS = [
  "password1",
  "password123",
  "12345678",
  "qwerty123",
  "ayesha123",
];

const buildPasswordRules = (values: typeof SAMPLE_VALUES): PasswordRule[] => {
  const personal = [
    values.firstName,
    values.lastName,
    values.phone,
    values.email.split("@")[0],
  ].filter((part) => part.length >= 3);
  return [
    {
      id: "password_too_short",
      label: "At least 6 characters",
      test: (v) => v.length >= 6,
    },
    {
      id: "password_no_digit",
      label: "Contains at least one digit",
      test: (v) => /\d/.test(v),
    },
    {
      id: "password_common",
      label: "Not a commonly used password",
      test: (v) => v.length > 0 && !BANNED_PASSWORDS.includes(v.toLowerCase()),
    },
    {
      id: "password_contains_personal",
      label: "Not your name, number or email",
      test: (v) =>
        v.length > 0 &&
        !personal.some((part) =>
          v.toLowerCase().includes(part.toLowerCase()),
        ),
    },
  ];
};

const SERVER_FAILED_RULES = [
  "password_common",
  "password_contains_personal",
];

const ALERT_KINDS: Partial<Record<FeatureState, RegistrationAlertKind>> = {
  "password-policy-error": "password-policy",
  "api-409-phone-verified": "duplicate-phone-verified",
  "api-409-phone-resumable": "duplicate-phone-resumable",
  "api-409-email": "duplicate-email",
  "api-429": "rate-limited",
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
    STATES_BY_VIEWPORT[viewport].map((state) => ({
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
        <FormColumn viewport={focused.viewport} state={focused.state} fullscreen />
      </AuthShell>
    );
  }

  const description =
    "Side brand panel + paired-field form on desktop/tablet; vertical stack with mobile brand header + menu sheet. All three viewports carry the full nine-state matrix. Desktop and tablet show the whole password policy up-front; mobile keeps progressive reveal and lists server-rejected rules under the field, and stacks alert actions full-width.";

  if (focused) {
    return (
      <div className="min-h-screen bg-muted/30 px-4 py-10 text-foreground">
        <div className="mx-auto flex max-w-[1360px] flex-col items-center gap-6">
          <PreviewHeader
            featureId="M01-F01"
            lifecycle="design-approved"
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
          lifecycle="design-approved"
          title="Self-Service Registration"
          description={description}
        />

        {viewports.map((viewport) => (
          <section key={viewport} className="flex flex-col gap-6">
            <ViewportSectionHeading viewport={viewport} />
            <div className="flex flex-col items-center gap-8">
              {STATES_BY_VIEWPORT[viewport].map((state) => (
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

// Progressive reveal only renders rules the value passes, so a server-rejected
// rule would be invisible. On the viewports that keep progressive reveal, the
// rejected codes are listed here instead — every failed rule stays visible
// (F14 R07 / AC8 / AC9) without the vertical cost of the always-on checklist.
const PasswordRuleFailures = ({
  rules,
  failedRuleIds,
}: {
  rules: PasswordRule[];
  failedRuleIds: string[];
}) => (
  <FieldError>
    <ul className="flex flex-col gap-1">
      {rules
        .filter((rule) => failedRuleIds.includes(rule.id))
        .map((rule) => (
          <li key={rule.id} className="flex items-start gap-1.5">
            <IconX className="mt-0.5 size-3.5 shrink-0" />
            {rule.label}
          </li>
        ))}
    </ul>
  </FieldError>
);

const FormColumn = ({
  viewport,
  state,
  fullscreen = false,
}: {
  viewport: Viewport;
  state: FeatureState;
  fullscreen?: boolean;
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const isMobile = viewport === "mobile";
  const isTablet = viewport === "tablet";
  const checklistMode = PASSWORD_CHECKLIST_MODE_BY_VIEWPORT[viewport];

  const values =
    state === "empty"
      ? EMPTY_VALUES
      : state === "error"
        ? ERROR_VALUES
        : state === "password-policy-error"
          ? POLICY_ERROR_VALUES
          : SAMPLE_VALUES;

  const showFieldErrors = state === "error";
  const isPolicyError = state === "password-policy-error";
  const isBlockingApiError =
    state.startsWith("api-409") || state === "api-429";
  const isLoading = state === "loading";
  const tcChecked = state !== "empty";
  const alertKind = ALERT_KINDS[state];

  const passwordRules = buildPasswordRules(values);
  const passwordFieldInvalid = showFieldErrors || isPolicyError;
  const failedRuleIds = isPolicyError
    ? SERVER_FAILED_RULES
    : showFieldErrors
      ? passwordRules
          .filter((rule) => !rule.test(values.password))
          .map((rule) => rule.id)
      : undefined;

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
              animate={passwordFieldInvalid ? { x: SHAKE_KEYFRAMES } : { x: 0 }}
              transition={{ duration: 0.45, ease: "easeInOut" }}
            >
              <Field data-invalid={passwordFieldInvalid || undefined}>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <PasswordInput
                  id="password"
                  name="password"
                  autoComplete="new-password"
                  placeholder="At least 6 chars, 1 digit"
                  defaultValue={values.password}
                  disabled={isLoading}
                  aria-invalid={passwordFieldInvalid || undefined}
                  visible={showPassword}
                  onToggle={() => setShowPassword((s) => !s)}
                />
                {checklistMode === "all" ? (
                  <PasswordChecklist
                    value={values.password}
                    rules={passwordRules}
                    mode="all"
                    failedRuleIds={failedRuleIds}
                  />
                ) : isPolicyError ? (
                  <PasswordRuleFailures
                    rules={passwordRules}
                    failedRuleIds={SERVER_FAILED_RULES}
                  />
                ) : passwordError ? (
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
            {alertKind ? (
              <motion.div
                key={state}
                variants={alertVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="overflow-hidden"
              >
                <RegistrationAlert
                  kind={alertKind}
                  phone={values.phone || SAMPLE_VALUES.phone}
                  email={values.email || SAMPLE_VALUES.email}
                  stackActions={isMobile}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div>
            <motion.div
              whileHover={
                !isLoading && !isBlockingApiError ? { y: -1 } : undefined
              }
              whileTap={
                !isLoading && !isBlockingApiError ? { scale: 0.98 } : undefined
              }
              transition={{ duration: 0.15, ease: EASE_OUT_QUART }}
            >
              <Button
                type="button"
                size="lg"
                disabled={isLoading || isBlockingApiError}
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
