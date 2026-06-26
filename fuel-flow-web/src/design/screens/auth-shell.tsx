import type { ReactNode } from "react";
import { Fuel, ShieldCheck, BarChart3, Wallet } from "lucide-react";

/**
 * Shared two-column layout for the auth-area design previews.
 * The right brand panel is identical across login / register / verify / recovery;
 * the form column is the variable child.
 */
interface AuthShellProps {
  children: ReactNode;
  /** Pitch shown on the brand panel — defaults to the marketing baseline. */
  pitch?: {
    eyebrow?: string;
    heading: string;
    body: string;
    bullets?: { label: string; icon: ReactNode }[];
  };
}

const DEFAULT_PITCH = {
  eyebrow: "Filling station OS",
  heading: "Run every shift, tank, and udhaar from one screen",
  body: "Track fuel sales, reconcile shifts, manage credit customers, and watch every station — built for the Pakistani market.",
  bullets: [
    { label: "Shift-level cash + meter reconciliation", icon: <ShieldCheck className="size-4 text-primary" /> },
    { label: "Realtime stock variance per tank", icon: <BarChart3 className="size-4 text-primary" /> },
    { label: "Credit customers & party ledgers", icon: <Wallet className="size-4 text-primary" /> },
  ],
};

export function AuthShell({ children, pitch = DEFAULT_PITCH }: AuthShellProps) {
  return (
    <div className="grid min-h-[640px] overflow-hidden rounded-xl border border-border bg-background lg:grid-cols-[1.05fr_0.95fr]">
      <div className="flex flex-col gap-6 p-8 md:p-12">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Fuel className="size-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight">Fuel Flow</span>
        </div>
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <div className="w-full max-w-sm">{children}</div>
        </div>
        <p className="text-center text-[11px] text-muted-foreground">
          By continuing you agree to our <span className="underline underline-offset-2">Terms</span> and{" "}
          <span className="underline underline-offset-2">Privacy</span>.
        </p>
      </div>
      <div className="relative hidden lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-background" />
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(var(--foreground)_1px,transparent_1px),linear-gradient(90deg,var(--foreground)_1px,transparent_1px)] [background-size:32px_32px]"
        />
        <div className="relative flex h-full flex-col justify-between p-10">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {pitch.eyebrow ?? "Fuel Flow"}
          </div>
          <div className="flex flex-col gap-6">
            <h2 className="max-w-md text-3xl font-semibold leading-tight tracking-tight text-foreground">
              {pitch.heading}
            </h2>
            <p className="max-w-md text-sm text-muted-foreground">{pitch.body}</p>
            {pitch.bullets?.length ? (
              <ul className="flex flex-col gap-3">
                {pitch.bullets.map((b) => (
                  <li key={b.label} className="flex items-center gap-3 text-sm text-foreground">
                    <span className="flex size-7 items-center justify-center rounded-md bg-background/80 ring-1 ring-border">
                      {b.icon}
                    </span>
                    {b.label}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border bg-background/60 p-4 backdrop-blur-sm">
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Trusted by stations across</span>
              <span className="text-sm font-medium">Punjab · Sindh · KPK</span>
            </div>
            <div className="flex gap-1">
              <div className="size-2 rounded-full bg-success" />
              <div className="size-2 rounded-full bg-primary" />
              <div className="size-2 rounded-full bg-chart-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
