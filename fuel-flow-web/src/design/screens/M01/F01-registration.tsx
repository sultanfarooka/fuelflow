import { CheckCircle2, Mail, Phone, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { AuthShell } from "../auth-shell";
import { PreviewFrame } from "../preview-frame";

const PASSWORD_RULES = [
  { label: "At least 6 characters", met: true },
  { label: "Contains a number", met: true },
  { label: "Mix of letters & numbers", met: true },
];

function RegistrationForm() {
  return (
    <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Create your owner account</h1>
        <p className="text-sm text-muted-foreground">
          You can add your organisation and first station after signing in.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="reg-name">Full name</Label>
          <Input id="reg-name" className="h-11" defaultValue="Asif Ahmed" autoComplete="name" />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="reg-phone" className="flex items-center gap-2">
            <Phone className="size-3.5 text-muted-foreground" />
            Phone number
            <Badge variant="outline" className="text-[10px]">Required</Badge>
          </Label>
          <Input
            id="reg-phone"
            className="h-11"
            defaultValue="+92 333 555 1234"
            inputMode="tel"
            autoComplete="tel"
          />
          <p className="text-xs text-muted-foreground">
            We&apos;ll send a 6-digit code to confirm your number. Pakistani format `+92XXXXXXXXXX`.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="reg-email" className="flex items-center gap-2">
            <Mail className="size-3.5 text-muted-foreground" />
            Email
            <Badge variant="secondary" className="text-[10px]">Optional</Badge>
          </Label>
          <Input
            id="reg-email"
            type="email"
            className="h-11"
            defaultValue="asif@khanstation.pk"
            autoComplete="email"
          />
          <p className="text-xs text-muted-foreground">
            Adds an email fallback for login &amp; recovery once verified.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="reg-password">Password</Label>
          <Input id="reg-password" type="password" className="h-11" defaultValue="••••••••••" />
          <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {PASSWORD_RULES.map((r) => (
              <li key={r.label} className="flex items-center gap-1.5">
                <CheckCircle2
                  className={r.met ? "size-3.5 text-success" : "size-3.5 text-muted-foreground/60"}
                />
                {r.label}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Button type="submit" size="lg" className="w-full">
        Create account &amp; send OTP
      </Button>

      <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-primary" />
        <span>
          We never share your phone number. SMS OTPs are rate-limited per phone and per IP (per M01-F09-R12).
        </span>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <a href="#" onClick={(e) => e.preventDefault()} className="font-medium text-primary underline-offset-4 hover:underline">
          Sign in
        </a>
      </p>
    </form>
  );
}

export default function F01RegistrationDesignPage() {
  return (
    <div className="flex flex-col gap-10">
      <PreviewFrame
        title="Owner registration"
        caption="Phone required, email optional. Org + first station collected later in onboarding."
        bleed
      >
        <AuthShell
          pitch={{
            eyebrow: "Step 1 of 3 · Account",
            heading: "Start managing your fuel station in minutes",
            body: "Create a free Owner account, verify your phone, then add your first station — no card required during your 14-day trial.",
            bullets: [
              { label: "14-day trial, no card", icon: <CheckCircle2 className="size-4 text-primary" /> },
              { label: "Phone-first signup (M01-F09)", icon: <Phone className="size-4 text-primary" /> },
              { label: "Pakistani currency, RTL-ready UI", icon: <ShieldCheck className="size-4 text-primary" /> },
            ],
          }}
        >
          <RegistrationForm />
        </AuthShell>
      </PreviewFrame>

      <PreviewFrame
        title="Registration — mobile"
        caption="Brand panel hidden; form fills the viewport."
        viewport="mobile"
        bleed
      >
        <div className="px-6 py-8">
          <RegistrationForm />
        </div>
      </PreviewFrame>
    </div>
  );
}
