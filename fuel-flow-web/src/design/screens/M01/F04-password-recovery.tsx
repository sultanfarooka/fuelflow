import { ArrowRight, KeyRound, Mail, MessageSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { AuthShell } from "../auth-shell";
import { PreviewFrame } from "../preview-frame";

function ChannelChoice() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
        <p className="text-sm text-muted-foreground">
          Choose how you&apos;d like to receive the reset code or link.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          className="group flex items-center gap-4 rounded-lg border border-border bg-card p-4 text-start transition-colors hover:border-primary/50 hover:bg-primary/5"
        >
          <span className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
            <MessageSquare className="size-5" />
          </span>
          <span className="flex flex-1 flex-col">
            <span className="font-medium">SMS OTP to phone</span>
            <span className="text-xs text-muted-foreground">+92 333 ••• 1234 · 6-digit code, 5-min TTL</span>
          </span>
          <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </button>
        <button
          type="button"
          className="group flex items-center gap-4 rounded-lg border border-border bg-card p-4 text-start transition-colors hover:border-primary/50 hover:bg-primary/5"
        >
          <span className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Mail className="size-5" />
          </span>
          <span className="flex flex-1 flex-col">
            <span className="font-medium">Email reset link</span>
            <span className="text-xs text-muted-foreground">asif@khan••••••.pk · valid 24 hours</span>
          </span>
          <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Only one channel available?{" "}
        <a href="#" onClick={(e) => e.preventDefault()} className="text-primary underline underline-offset-2">
          We&apos;ll skip the choice
        </a>
        .
      </p>

      <a href="#" onClick={(e) => e.preventDefault()} className="text-center text-sm text-primary underline-offset-4 hover:underline">
        Back to sign in
      </a>
    </div>
  );
}

function SetNewPassword() {
  return (
    <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Set a new password</h1>
        <p className="text-sm text-muted-foreground">
          Choose something you haven&apos;t used here before. Minimum 6 characters with at least one number.
        </p>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="new-pw">New password</Label>
          <Input id="new-pw" type="password" className="h-11" defaultValue="••••••••••" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="new-pw-2">Confirm new password</Label>
          <Input id="new-pw-2" type="password" className="h-11" defaultValue="••••••••••" />
        </div>
      </div>
      <Button type="submit" size="lg" className="w-full">
        <KeyRound className="me-2 size-4" />
        Update password &amp; sign in
      </Button>
    </form>
  );
}

export default function F04PasswordRecoveryDesignPage() {
  return (
    <div className="flex flex-col gap-10">
      <PreviewFrame
        title="Choose recovery channel"
        caption="R01 + R08: surface both channels when both are set; auto-skip when only one is available."
        state="Both channels set"
        bleed
      >
        <AuthShell
          pitch={{
            eyebrow: "Password recovery · M01-F04",
            heading: "Two safe ways back into your account",
            body: "Pick whichever channel is most convenient. Codes are single-use and short-lived to keep things tight.",
            bullets: [
              { label: "Phone OTP: 5-minute TTL", icon: <MessageSquare className="size-4 text-primary" /> },
              { label: "Email link: 24-hour TTL", icon: <Mail className="size-4 text-primary" /> },
              { label: "Single-use, rotated on every reset", icon: <KeyRound className="size-4 text-primary" /> },
            ],
          }}
        >
          <ChannelChoice />
        </AuthShell>
      </PreviewFrame>

      <PreviewFrame
        title="Set new password"
        caption="Step 3 of the recovery flow — after OTP or email link is confirmed."
        bleed
      >
        <AuthShell>
          <SetNewPassword />
        </AuthShell>
      </PreviewFrame>
    </div>
  );
}
