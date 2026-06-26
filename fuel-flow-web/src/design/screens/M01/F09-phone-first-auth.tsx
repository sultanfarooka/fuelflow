import { useState } from "react";
import { ArrowLeft, CheckCircle2, MessageSquare, Phone, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import { AuthShell } from "../auth-shell";
import { PreviewFrame } from "../preview-frame";

function OtpBoxes({ value }: { value: string }) {
  return (
    <div className="flex justify-between gap-2">
      {Array.from({ length: 6 }).map((_, i) => {
        const digit = value[i] ?? "";
        const isCursor = !digit && i === value.length;
        return (
          <div
            key={i}
            className={cn(
              "flex h-14 flex-1 items-center justify-center rounded-md border bg-background text-lg font-semibold tabular-nums",
              digit ? "border-primary/60 text-foreground" : "border-border text-muted-foreground",
              isCursor && "ring-2 ring-ring/40",
            )}
          >
            {digit || (isCursor ? <span className="h-5 w-px animate-pulse bg-foreground" /> : "•")}
          </div>
        );
      })}
    </div>
  );
}

function PhoneEntry() {
  return (
    <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Verify your phone</h1>
        <p className="text-sm text-muted-foreground">
          Enter your Pakistani mobile number — we&apos;ll send a 6-digit code.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="phone-phone">Mobile number</Label>
        <div className="flex">
          <span className="inline-flex h-11 items-center rounded-s-md border border-e-0 border-border bg-muted px-3 text-sm text-muted-foreground">
            +92
          </span>
          <Input
            id="phone-phone"
            inputMode="tel"
            className="h-11 rounded-s-none"
            defaultValue="333 555 1234"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          One OTP at a time. Up to 10 per day, 1 resend every 60s.
        </p>
      </div>
      <Button type="submit" size="lg" className="w-full">
        <MessageSquare className="me-2 size-4" />
        Send code
      </Button>
    </form>
  );
}

function OtpStep() {
  const [value] = useState("482301");
  return (
    <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
      <button
        type="button"
        className="-ms-1 flex w-fit items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Change phone number
      </button>
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Enter the 6-digit code</h1>
        <p className="text-sm text-muted-foreground">
          We sent it to <span className="font-medium text-foreground">+92 333 555 1234</span>.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Label>Verification code</Label>
        <OtpBoxes value={value} />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Expires in 4:32</span>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline disabled:opacity-50"
          >
            <RefreshCw className="size-3" />
            Resend
          </button>
        </div>
      </div>
      <Button type="submit" size="lg" className="w-full">
        Verify &amp; continue
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Didn&apos;t get the SMS? Wait 60 seconds, then tap Resend.
      </p>
    </form>
  );
}

function VerifiedStep() {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-success/10 ring-1 ring-success/30">
        <CheckCircle2 className="size-8 text-success" />
      </div>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Phone verified</h1>
        <p className="max-w-xs text-sm text-muted-foreground">
          Your account is active. Let&apos;s set up your organisation and first station.
        </p>
      </div>
      <Button size="lg" className="w-full">
        Continue to onboarding
      </Button>
    </div>
  );
}

export default function F09PhoneFirstAuthDesignPage() {
  return (
    <div className="flex flex-col gap-10">
      <PreviewFrame
        title="Phone entry"
        caption="Pakistani number prefixed +92. Rate-limit hint visible (R12)."
        state="Step 1 of 3"
        bleed
      >
        <AuthShell
          pitch={{
            eyebrow: "Phone-first authentication · M01-F09",
            heading: "Phone is the primary identifier",
            body: "Email is optional — your number is what we use for login, recovery, and security alerts. SMS OTPs are rate-limited per number and per IP.",
            bullets: [
              { label: "6-digit code, 5-minute TTL", icon: <MessageSquare className="size-4 text-primary" /> },
              { label: "Resend after 60 seconds", icon: <RefreshCw className="size-4 text-primary" /> },
              { label: "10 OTPs / day per number", icon: <Phone className="size-4 text-primary" /> },
            ],
          }}
        >
          <PhoneEntry />
        </AuthShell>
      </PreviewFrame>

      <PreviewFrame
        title="OTP entry"
        caption="6-digit input with countdown + resend (R04)."
        state="Step 2 of 3"
        bleed
      >
        <AuthShell>
          <OtpStep />
        </AuthShell>
      </PreviewFrame>

      <PreviewFrame
        title="Verified"
        caption="Success state hands off to onboarding."
        state="Step 3 of 3"
        bleed
      >
        <AuthShell>
          <VerifiedStep />
        </AuthShell>
      </PreviewFrame>

      <PreviewFrame
        title="OTP entry — mobile"
        viewport="mobile"
        bleed
      >
        <div className="px-6 py-8">
          <OtpStep />
        </div>
      </PreviewFrame>
    </div>
  );
}
