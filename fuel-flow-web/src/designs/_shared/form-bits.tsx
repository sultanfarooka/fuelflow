import { AnimatePresence, motion } from "motion/react";
import { IconCheck, IconEye, IconEyeOff, IconX } from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

import { EASE_OUT_QUART, INPUT_FOCUS_RING } from "./animation";

type PasswordInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  visible: boolean;
  onToggle: () => void;
};

export const PasswordInput = ({
  visible,
  onToggle,
  className,
  disabled,
  ...rest
}: PasswordInputProps) => (
  <div className="relative">
    <Input
      type={visible ? "text" : "password"}
      disabled={disabled}
      className={cn("pe-10", INPUT_FOCUS_RING, className)}
      {...rest}
    />
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-label={visible ? "Hide password" : "Show password"}
      aria-pressed={visible}
      className="absolute end-1 top-1/2 -translate-y-1/2 inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
    >
      {visible ? (
        <IconEyeOff className="size-4" />
      ) : (
        <IconEye className="size-4" />
      )}
    </button>
  </div>
);

export type PasswordRule = {
  id: string;
  label: string;
  test: (value: string) => boolean;
};

export const DEFAULT_PASSWORD_RULES: PasswordRule[] = [
  { id: "len", label: "At least 6 characters", test: (v) => v.length >= 6 },
  { id: "digit", label: "Contains a digit", test: (v) => /\d/.test(v) },
];

// `mode` controls how much of the policy is exposed:
//
//   "satisfied" (default) — progressive reveal. Only rules the value already
//     passes are rendered; nothing shows on a pristine field.
//   "all" — every rule is rendered from first paint with an explicit pass/fail
//     mark, so the user can see the whole policy before typing.
//
// `failedRuleIds` carries the rule codes the server rejected (F14 R07 returns an
// array, not a single message). A flagged rule renders as a hard failure even
// when the local `test` would pass.
export const PasswordChecklist = ({
  value,
  rules = DEFAULT_PASSWORD_RULES,
  mode = "satisfied",
  failedRuleIds,
}: {
  value: string;
  rules?: PasswordRule[];
  mode?: "satisfied" | "all";
  failedRuleIds?: string[];
}) => {
  const showAll = mode === "all";
  const visible = showAll ? rules : rules.filter((r) => r.test(value));
  if (visible.length === 0) return null;
  return (
    <ul
      className={cn(
        "pt-1 text-xs",
        showAll
          ? "flex flex-col gap-1"
          : "flex flex-wrap gap-x-4 gap-y-1",
      )}
    >
      <AnimatePresence initial={false}>
        {visible.map((rule) => {
          const flagged = failedRuleIds?.includes(rule.id) ?? false;
          const passed = !flagged && rule.test(value);
          return (
            <motion.li
              key={rule.id}
              layout
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.2, ease: EASE_OUT_QUART }}
              className={cn(
                "inline-flex items-center gap-1.5",
                passed
                  ? "text-success"
                  : flagged
                    ? "font-medium text-destructive"
                    : "text-muted-foreground",
              )}
            >
              <AnimatePresence initial={false} mode="wait">
                <motion.span
                  key={passed ? "passed" : "unmet"}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={{ duration: 0.18, ease: EASE_OUT_QUART }}
                  className="inline-flex"
                >
                  {passed ? (
                    <IconCheck className="size-3.5" />
                  ) : (
                    <IconX className="size-3.5" />
                  )}
                </motion.span>
              </AnimatePresence>
              {rule.label}
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
};

export type StepperStep = {
  id: number;
  label: string;
};

export const Stepper = ({
  steps,
  currentStep,
}: {
  steps: StepperStep[];
  currentStep: number;
}) => (
  <ol className="flex items-center gap-3">
    {steps.map((step, idx) => {
      const isActive = step.id === currentStep;
      const isDone = step.id < currentStep;
      return (
        <li key={step.id} className="flex items-center gap-3">
          <motion.div
            initial={false}
            animate={{
              backgroundColor: isActive
                ? "var(--primary)"
                : isDone
                  ? "var(--foreground)"
                  : "var(--muted)",
              color: isActive
                ? "var(--primary-foreground)"
                : isDone
                  ? "var(--background)"
                  : "var(--muted-foreground)",
            }}
            transition={{ duration: 0.25, ease: EASE_OUT_QUART }}
            className="flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
          >
            {isDone ? <IconCheck className="size-3.5" /> : step.id}
          </motion.div>
          <span
            className={cn(
              "text-xs font-medium",
              isActive ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {step.label}
          </span>
          {idx < steps.length - 1 && (
            <span
              aria-hidden
              className="relative h-px w-6 overflow-hidden bg-border"
            >
              <motion.span
                className="absolute inset-y-0 w-1/3 bg-primary"
                animate={{ left: ["-40%", "110%"] }}
                transition={{
                  duration: 2.4,
                  ease: "linear",
                  repeat: Infinity,
                  repeatDelay: 1.6,
                }}
              />
            </span>
          )}
        </li>
      );
    })}
  </ol>
);
