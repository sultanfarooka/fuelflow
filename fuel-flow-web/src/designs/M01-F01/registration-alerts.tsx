import {
  IconAlertHexagon,
  IconArrowRight,
  IconClockHour4,
  IconLock,
  IconMail,
  IconSend,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/designs/_shared";

export type RegistrationAlertKind =
  | "password-policy"
  | "duplicate-phone-verified"
  | "duplicate-phone-resumable"
  | "duplicate-email"
  | "rate-limited";

const maskPhone = (phone: string) =>
  `${phone.slice(0, 4)} ••• ${phone.slice(-4)}`;

export const RegistrationAlert = ({
  kind,
  phone,
  email,
  stackActions = false,
}: {
  kind: RegistrationAlertKind;
  phone: string;
  email: string;
  stackActions?: boolean;
}) => {
  if (kind === "password-policy") {
    return (
      <InlineAlert
        icon={IconLock}
        title="Pick a password that's harder to guess"
        description="The rules marked in red above aren't met yet. Fix those and submit again — nothing else on the form needs changing."
      />
    );
  }

  if (kind === "duplicate-phone-verified") {
    return (
      <InlineAlert
        icon={IconAlertHexagon}
        stackActions={stackActions}
        title="This number is already registered"
        description={
          <>
            A verified Fuel Flow account already uses {maskPhone(phone)}. Sign
            in with it, or reset the password if you can&apos;t remember it.
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
              Reset password
            </Button>
          </>
        }
      />
    );
  }

  if (kind === "duplicate-phone-resumable") {
    return (
      <InlineAlert
        variant="default"
        icon={IconSend}
        iconClassName="text-primary"
        stackActions={stackActions}
        className="border-s-4 border-border border-s-primary bg-muted/50 ps-4"
        title="This number needs verifying"
        description={
          <>
            You started signing up with {maskPhone(phone)} but never entered the
            code we texted. Pick up where you left off and we&apos;ll send a
            fresh one — the daily code limit for this number still applies.
          </>
        }
        actions={
          <>
            <Button type="button" size="sm">
              Continue verifying
              <IconArrowRight className="size-3.5" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="bg-background"
            >
              Use a different number
            </Button>
          </>
        }
      />
    );
  }

  if (kind === "duplicate-email") {
    return (
      <InlineAlert
        icon={IconMail}
        stackActions={stackActions}
        title="This email is already in use"
        description={
          <>
            {email} belongs to another Fuel Flow account. Sign in with it, swap
            in a different address, or clear the field — email is optional.
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
              Sign in with this email
            </Button>
            <Button type="button" size="sm" variant="ghost">
              Use a different email
            </Button>
          </>
        }
      />
    );
  }

  return (
    <InlineAlert
      icon={IconClockHour4}
      title="Too many sign-up attempts"
      description="You've hit the per-IP limit. Please wait about 15 minutes before trying again, or sign in if you already have an account."
    />
  );
};
