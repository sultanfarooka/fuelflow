import { AlertTriangle, CheckCircle2, Mail, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

import { AuthShell } from "../auth-shell";
import { PreviewFrame } from "../preview-frame";

function CheckInbox() {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/30">
        <Mail className="size-8 text-primary" />
      </div>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Check your inbox</h1>
        <p className="max-w-xs text-sm text-muted-foreground">
          We sent a verification link to{" "}
          <span className="font-medium text-foreground">asif@khanstation.pk</span>. It expires in 24 hours.
        </p>
      </div>
      <div className="flex w-full flex-col gap-2">
        <Button size="lg" variant="outline" className="w-full">
          <RefreshCw className="me-2 size-4" />
          Resend verification email
        </Button>
        <Button size="lg" variant="ghost" className="w-full">
          Use a different email
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Wrong inbox? Check your spam, or contact support if it doesn&apos;t arrive within a few minutes.
      </p>
    </div>
  );
}

function Expired() {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10 ring-1 ring-destructive/30">
        <AlertTriangle className="size-8 text-destructive" />
      </div>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">This link has expired</h1>
        <p className="max-w-xs text-sm text-muted-foreground">
          Verification links are valid for 24 hours and can only be used once. We&apos;ll send you a fresh one.
        </p>
      </div>
      <Button size="lg" className="w-full">
        Send a new link
      </Button>
      <a href="#" onClick={(e) => e.preventDefault()} className="text-xs text-primary underline-offset-4 hover:underline">
        Back to sign in
      </a>
    </div>
  );
}

function Verified() {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-success/10 ring-1 ring-success/30">
        <CheckCircle2 className="size-8 text-success" />
      </div>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Email verified</h1>
        <p className="max-w-xs text-sm text-muted-foreground">
          You can now use{" "}
          <span className="font-medium text-foreground">asif@khanstation.pk</span> as a fallback login channel.
        </p>
      </div>
      <Button size="lg" className="w-full">
        Continue to dashboard
      </Button>
    </div>
  );
}

export default function F02EmailVerificationDesignPage() {
  return (
    <div className="flex flex-col gap-10">
      <PreviewFrame
        title="Check your inbox"
        caption="Post-registration confirmation, with resend (R02) and alt-email actions."
        state="Pending"
        bleed
      >
        <AuthShell>
          <CheckInbox />
        </AuthShell>
      </PreviewFrame>

      <PreviewFrame
        title="Expired or used token"
        caption="AC1 of M01-F02: clear error + resend affordance."
        state="Error · expired"
        bleed
      >
        <AuthShell>
          <Expired />
        </AuthShell>
      </PreviewFrame>

      <PreviewFrame
        title="Verified"
        caption="Idempotent success — works on first hit AND when the account is already verified (AC2)."
        state="Success"
        bleed
      >
        <AuthShell>
          <Verified />
        </AuthShell>
      </PreviewFrame>
    </div>
  );
}
