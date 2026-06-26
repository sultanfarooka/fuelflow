import { Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { GoogleIcon } from "@/components/ui/icons/google-icon";

import { AuthShell } from "../auth-shell";
import { PreviewFrame } from "../preview-frame";

function LoginForm({ withError = false }: { withError?: boolean }) {
  return (
    <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Sign in with your phone number or verified email.
        </p>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="login-identifier">Phone or email</Label>
          <Input
            id="login-identifier"
            className="h-11"
            placeholder="03001234567 or owner@station.pk"
            defaultValue="03335551234"
            autoComplete="username"
          />
          <p className="text-xs text-muted-foreground">
            Phone takes precedence — email login requires a verified email.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password">Password</Label>
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="text-xs text-primary underline-offset-4 hover:underline"
            >
              Forgot password?
            </a>
          </div>
          <Input id="login-password" className="h-11" type="password" defaultValue="••••••••" />
        </div>
        {withError ? (
          <div
            role="alert"
            className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            <p className="font-medium">Verify your phone first</p>
            <p className="mt-0.5 text-xs">
              We sent a 6-digit code to +92 333 555 1234.{" "}
              <a href="#" onClick={(e) => e.preventDefault()} className="underline underline-offset-4">
                Resend code
              </a>
            </p>
          </div>
        ) : null}
        <Button type="submit" size="lg" className="w-full">
          Sign in
        </Button>
      </div>
      <div className="relative">
        <Separator />
        <span className="absolute inset-s-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-[10px] uppercase tracking-wider text-muted-foreground">
          Or continue with
        </span>
      </div>
      <div className="flex flex-col gap-2">
        <Button type="button" size="lg" variant="outline" disabled className="w-full justify-center">
          <GoogleIcon className="me-2 size-4 shrink-0" />
          Sign in with Google
          <span className="ms-2 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
            Coming soon
          </span>
        </Button>
        <Button type="button" size="lg" variant="outline" disabled className="w-full justify-center">
          <Smartphone className="me-2 size-4 shrink-0" />
          Phone-only quick login
          <span className="ms-2 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
            Coming soon
          </span>
        </Button>
      </div>
      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <a href="#" onClick={(e) => e.preventDefault()} className="font-medium text-primary underline-offset-4 hover:underline">
          Create one
        </a>
      </p>
    </form>
  );
}

export default function F03LoginDesignPage() {
  return (
    <div className="flex flex-col gap-10">
      <PreviewFrame
        title="Sign in"
        caption="Phone-or-email + password. Phone is the primary identifier per M01-F09."
        bleed
      >
        <AuthShell>
          <LoginForm />
        </AuthShell>
      </PreviewFrame>

      <PreviewFrame
        title="Sign in — needs phone verification"
        caption="AC4 of M01-F09: login blocked with a resend-OTP affordance."
        state="Error · phone not verified"
        bleed
      >
        <AuthShell>
          <LoginForm withError />
        </AuthShell>
      </PreviewFrame>

      <PreviewFrame
        title="Sign in — mobile"
        caption="Brand panel collapses below lg breakpoint; form scales to viewport."
        viewport="mobile"
        bleed
      >
        <div className="px-6 py-8">
          <LoginForm />
        </div>
      </PreviewFrame>
    </div>
  );
}
