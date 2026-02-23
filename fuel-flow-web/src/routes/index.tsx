import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/dark-mode-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/stores/auth-store";
import { logout } from "@/lib/api/auth";
import {
  Fuel,
  BarChart3,
  Users,
  Shield,
  Clock,
  CreditCard,
  Gauge,
  Bell,
  Globe,
  Smartphone,
  TrendingUp,
  Droplets,
  ChevronRight,
  Package,
  Settings,
  FileText,
  Check,
  X,
  Zap,
  Building2,
  Infinity as InfinityIcon,
  LogOut,
  User,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

/* ------------------------------------------------------------------ */
/*  WHAT: Landing page for Fuel Flow                                  */
/*  WHY:  First impression – communicates value proposition, features, */
/*        and target audience before the user signs in.                */
/*  HOW:  Pure Tailwind + Shadcn components, no external images.      */
/* ------------------------------------------------------------------ */

function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* ── Navbar ─────────────────────────────────────────────────── */}
      <Navbar />

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <HeroSection />

      {/* ── Key Highlights ─────────────────────────────────────────── */}
      <HighlightsSection />

      {/* ── Core Modules ───────────────────────────────────────────── */}
      <ModulesSection />

      {/* ── Pricing & Plans ───────────────────────────────────────── */}
      <PricingSection />

      {/* ── Why Fuel Flow ──────────────────────────────────────────── */}
      <WhySection />

      {/* ── Target Users ───────────────────────────────────────────── */}
      <UsersSection />

      {/* ── CTA ────────────────────────────────────────────────────── */}
      <CTASection />

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <Footer />
    </div>
  );
}

/* ================================================================== */
/*  Navbar                                                             */
/* ================================================================== */
function Navbar() {
  const { isAuthenticated, user, logout: clearAuth } = useAuthStore();

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      clearAuth();
      window.location.href = "/";
    }
  };

  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : (user?.email?.[0]?.toUpperCase() ?? "?");

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Fuel className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold tracking-tight">Fuel Flow</span>
        </div>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          <a
            href="#features"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Features
          </a>
          <a
            href="#modules"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Modules
          </a>
          <a
            href="#pricing"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Pricing
          </a>
          <a
            href="#why"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Why Fuel Flow
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <ModeToggle />
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                    {initials}
                  </div>
                  <span className="sr-only">User menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-medium">{user.fullName}</span>
                    <span className="text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    to="/dashboard"
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <User className="h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link to="/auth/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/auth/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

/* ================================================================== */
/*  Hero Section                                                       */
/* ================================================================== */
function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary/5 via-background to-background">
      {/* Decorative background circles */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />

      <div className="container relative mx-auto px-4 py-20 text-center md:py-32">
        <Badge variant="secondary" className="mb-4">
          Designed for Pakistan's Filling Stations
        </Badge>

        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
          Manage Your Filling Stations{" "}
          <span className="text-primary">Smarter</span>
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground md:text-xl">
          A comprehensive management system for fuel sales, inventory, shift
          operations, credit customers, and financial reporting — all in one
          place.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" className="gap-2">
            Start 14-Day Free Trial <ChevronRight className="h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline">
            View Demo
          </Button>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          No credit card required. Full Professional features during trial.
        </p>

        {/* Quick stats */}
        <div className="mx-auto mt-12 grid max-w-xl grid-cols-3 gap-8">
          <div>
            <p className="text-2xl font-bold text-primary md:text-3xl">10+</p>
            <p className="text-sm text-muted-foreground">Core Modules</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary md:text-3xl">100%</p>
            <p className="text-sm text-muted-foreground">Bilingual (EN/UR)</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary md:text-3xl">24/7</p>
            <p className="text-sm text-muted-foreground">Real-time Tracking</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================================================================== */
/*  Key Highlights                                                     */
/* ================================================================== */
const highlights = [
  {
    icon: Shield,
    title: "Multi-Station Support",
    description:
      "One owner, multiple stations. Consolidated dashboard with per-station data isolation.",
  },
  {
    icon: Gauge,
    title: "Nozzle-Level Tracking",
    description:
      "Track every litre sold from every nozzle. Automatic shortage and excess calculation.",
  },
  {
    icon: CreditCard,
    title: "Credit Management",
    description:
      "Manage udhaar customers with credit limits, aging reports, and automatic balance tracking.",
  },
  {
    icon: BarChart3,
    title: "Financial Reports",
    description:
      "Daily, weekly, and monthly reports with exports. Full audit trail for every transaction.",
  },
  {
    icon: Clock,
    title: "Shift Operations",
    description:
      "Open/close shifts, assign nozzlemen, collect cash, and track handover seamlessly.",
  },
  {
    icon: Globe,
    title: "Bilingual Interface",
    description:
      "Full English and Urdu support with Pakistani currency and date formatting.",
  },
];

function HighlightsSection() {
  return (
    <section id="features" className="border-b py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <Badge variant="outline" className="mb-3">
            Key Features
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Everything You Need to Run Your Station
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Built specifically for the Pakistani filling station industry with
            local business rules, OGRA compliance, and desi workflows.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {highlights.map((h) => (
            <Card
              key={h.title}
              className="group transition-shadow hover:shadow-md"
            >
              <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <h.icon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">{h.title}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {h.description}
                  </p>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ================================================================== */
/*  Core Modules                                                       */
/* ================================================================== */
const modules = [
  {
    icon: Users,
    name: "User & Access Management",
    desc: "Roles, permissions, multi-station access",
  },
  {
    icon: Droplets,
    name: "Fuel Inventory & Tanks",
    desc: "Dip readings, stock levels, fuel receiving",
  },
  {
    icon: Gauge,
    name: "Pump & Nozzle Ops",
    desc: "Meter readings, sales, shortage tracking",
  },
  {
    icon: Clock,
    name: "Shift Management",
    desc: "Cash collection, handover, assignments",
  },
  {
    icon: CreditCard,
    name: "Finance & Accounts",
    desc: "Credit customers, suppliers, expenses",
  },
  {
    icon: TrendingUp,
    name: "Pricing & Rates",
    desc: "Fuel prices, history, dealer margins",
  },
  {
    icon: BarChart3,
    name: "Reporting & Analytics",
    desc: "Dashboards, exports, daily summaries",
  },
  {
    icon: Settings,
    name: "Settings & Config",
    desc: "Station setup, dip charts, preferences",
  },
  {
    icon: Package,
    name: "Lubricants / Oil Shop",
    desc: "Oil inventory, sales, stock management",
  },
  {
    icon: Bell,
    name: "SMS & Notifications",
    desc: "Alerts for stock, prices, shortages",
  },
];

function ModulesSection() {
  return (
    <section id="modules" className="border-b bg-muted/40 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <Badge variant="outline" className="mb-3">
            10 Core Modules
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Complete Station Management
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Every aspect of your filling station — from the underground tank to
            the customer ledger — managed through purpose-built modules.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {modules.map((m, i) => (
            <Card
              key={m.name}
              className="text-center transition-shadow hover:shadow-md"
            >
              <CardContent className="pt-6">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <m.icon className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold">{m.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{m.desc}</p>
                <Badge variant="secondary" className="mt-2 text-[10px]">
                  Module {i + 1}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ================================================================== */
/*  Pricing Section                                                    */
/* ================================================================== */

/*
 * WHAT: Subscription pricing table with monthly/yearly toggle.
 * WHY:  From the PRD — Fuel Flow uses a 3-tier SaaS model (Starter,
 *       Professional, Enterprise) with a 14-day free trial giving
 *       Professional features so users experience the full product.
 * HOW:  useState toggles billing cycle. Yearly gives ~17% discount
 *       (2 months free). Prices shown in PKR.
 */

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  name: string;
  description: string;
  icon: React.ElementType;
  monthlyPrice: number;
  yearlyPrice: number;
  maxStations: string;
  maxUsers: string;
  popular?: boolean;
  features: PlanFeature[];
  cta: string;
}

const plans: Plan[] = [
  {
    name: "Starter",
    description: "For single-station owners getting started",
    icon: Fuel,
    monthlyPrice: 2999,
    yearlyPrice: 29990,
    maxStations: "1",
    maxUsers: "5",
    cta: "Start Free Trial",
    features: [
      { text: "Shift management", included: true },
      { text: "Fuel inventory & dip readings", included: true },
      { text: "Pump & nozzle tracking", included: true },
      { text: "Credit customer management", included: true },
      { text: "Pricing management", included: true },
      { text: "Basic reports", included: true },
      { text: "SMS & notifications", included: false },
      { text: "Report exports (PDF/Excel)", included: false },
      { text: "Lubricants / Oil shop", included: false },
      { text: "Promotional pricing", included: false },
    ],
  },
  {
    name: "Professional",
    description: "For growing businesses with multiple stations",
    icon: Building2,
    monthlyPrice: 7999,
    yearlyPrice: 79990,
    maxStations: "3",
    maxUsers: "15",
    popular: true,
    cta: "Start Free Trial",
    features: [
      { text: "Shift management", included: true },
      { text: "Fuel inventory & dip readings", included: true },
      { text: "Pump & nozzle tracking", included: true },
      { text: "Credit customer management", included: true },
      { text: "Pricing management", included: true },
      { text: "All reports & dashboards", included: true },
      { text: "SMS & notifications", included: true },
      { text: "Report exports (PDF/Excel)", included: true },
      { text: "Lubricants / Oil shop", included: true },
      { text: "Promotional pricing", included: true },
    ],
  },
  {
    name: "Enterprise",
    description: "For large operations needing unlimited scale",
    icon: Zap,
    monthlyPrice: 19999,
    yearlyPrice: 199990,
    maxStations: "Unlimited",
    maxUsers: "Unlimited",
    cta: "Contact Sales",
    features: [
      { text: "Everything in Professional", included: true },
      { text: "Unlimited stations", included: true },
      { text: "Unlimited users", included: true },
      { text: "Priority support", included: true },
      { text: "Custom branding", included: true },
      { text: "Dedicated account manager", included: true },
      { text: "SMS & notifications", included: true },
      { text: "Report exports (PDF/Excel)", included: true },
      { text: "Lubricants / Oil shop", included: true },
      { text: "Promotional pricing", included: true },
    ],
  },
];

/** Format number in Pakistani notation: Rs. 1,23,456 */
function formatPKR(amount: number): string {
  const str = amount.toString();
  // Pakistani grouping: last 3 digits, then groups of 2
  if (str.length <= 3) return `Rs. ${str}`;
  const last3 = str.slice(-3);
  let remaining = str.slice(0, -3);
  const groups: string[] = [];
  while (remaining.length > 2) {
    groups.unshift(remaining.slice(-2));
    remaining = remaining.slice(0, -2);
  }
  if (remaining) groups.unshift(remaining);
  return `Rs. ${groups.join(",")},${last3}`;
}

function PricingSection() {
  const [yearly, setYearly] = useState(false);

  return (
    <section id="pricing" className="border-b py-16 md:py-24">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center">
          <Badge variant="outline" className="mb-3">
            Pricing
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Start with a 14-day free trial — no credit card required. All plans
            include full access during trial.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="mt-8 flex items-center justify-center gap-3">
          <span
            className={`text-sm font-medium ${!yearly ? "text-foreground" : "text-muted-foreground"}`}
          >
            Monthly
          </span>
          <button
            onClick={() => setYearly(!yearly)}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              yearly ? "bg-primary" : "bg-muted-foreground/30"
            }`}
            aria-label="Toggle yearly billing"
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                yearly ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
          <span
            className={`text-sm font-medium ${yearly ? "text-foreground" : "text-muted-foreground"}`}
          >
            Yearly
          </span>
          {yearly && (
            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              Save ~17%
            </Badge>
          )}
        </div>

        {/* Plan Cards */}
        <div className="mx-auto mt-10 grid max-w-5xl gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative flex flex-col ${
                plan.popular
                  ? "border-primary shadow-lg ring-1 ring-primary"
                  : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="shadow-sm">Most Popular</Badge>
                </div>
              )}

              <CardHeader className="text-center">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <plan.icon className="h-6 w-6" />
                </div>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="flex-1 space-y-6">
                {/* Price */}
                <div className="text-center">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl font-extrabold">
                      {formatPKR(yearly ? plan.yearlyPrice : plan.monthlyPrice)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      /{yearly ? "year" : "month"}
                    </span>
                  </div>
                  {yearly && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatPKR(Math.round(plan.yearlyPrice / 12))}/month
                      billed annually
                    </p>
                  )}
                </div>

                {/* Limits */}
                <div className="flex justify-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="font-semibold">
                      {plan.maxStations === "Unlimited" ? (
                        <InfinityIcon className="mx-auto h-4 w-4" />
                      ) : (
                        plan.maxStations
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {Number(plan.maxStations) === 1 ? "Station" : "Stations"}
                    </p>
                  </div>
                  <Separator orientation="vertical" className="h-8" />
                  <div className="text-center">
                    <p className="font-semibold">
                      {plan.maxUsers === "Unlimited" ? (
                        <InfinityIcon className="mx-auto h-4 w-4" />
                      ) : (
                        plan.maxUsers
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">Users</p>
                  </div>
                </div>

                <Separator />

                {/* Features */}
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li
                      key={f.text}
                      className="flex items-center gap-2 text-sm"
                    >
                      {f.included ? (
                        <Check className="h-4 w-4 shrink-0 text-primary" />
                      ) : (
                        <X className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                      )}
                      <span
                        className={f.included ? "" : "text-muted-foreground/60"}
                      >
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                >
                  {plan.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Trial callout */}
        <div className="mx-auto mt-10 max-w-2xl rounded-lg border bg-muted/50 p-6 text-center">
          <h3 className="font-semibold">14-Day Free Trial on All Plans</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Every new account gets full{" "}
            <span className="font-medium text-foreground">Professional</span>{" "}
            features for 14 days. No credit card needed. When the trial ends,
            choose a plan or your account switches to read-only mode — your data
            is always safe.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Check className="h-3.5 w-3.5 text-primary" /> No credit card
              required
            </span>
            <span className="flex items-center gap-1">
              <Check className="h-3.5 w-3.5 text-primary" /> Full features
              during trial
            </span>
            <span className="flex items-center gap-1">
              <Check className="h-3.5 w-3.5 text-primary" /> 3-day grace period
              after expiry
            </span>
            <span className="flex items-center gap-1">
              <Check className="h-3.5 w-3.5 text-primary" /> Bank transfer &
              JazzCash/Easypaisa
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================================================================== */
/*  Why Fuel Flow                                                      */
/* ================================================================== */
const reasons = [
  {
    icon: Shield,
    title: "Built for Pakistan",
    description:
      "Pakistani currency formatting (Rs.), Urdu language support, OGRA-compliant pricing, and local business workflows like udhaar.",
  },
  {
    icon: Smartphone,
    title: "Works on Any Device",
    description:
      "Progressive Web App — install on phones, tablets, or desktops. Works offline for critical features.",
  },
  {
    icon: Users,
    title: "Role-Based Access",
    description:
      "Granular permissions per module. Owners see everything, managers run day-to-day, nozzlemen enter readings.",
  },
  {
    icon: FileText,
    title: "Full Audit Trail",
    description:
      "Every price change, stock adjustment, and credit entry is logged. Complete transparency and accountability.",
  },
];

function WhySection() {
  return (
    <section id="why" className="border-b py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <Badge variant="outline" className="mb-3">
            Why Choose Us
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Why Fuel Flow?
          </h2>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {reasons.map((r) => (
            <div key={r.title} className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <r.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">{r.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {r.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ================================================================== */
/*  Target Users                                                       */
/* ================================================================== */
const targetUsers = [
  {
    role: "Station Owners",
    desc: "Full control over multiple stations with consolidated dashboards.",
  },
  {
    role: "Station Managers",
    desc: "Day-to-day operations, shift management, and reporting.",
  },
  {
    role: "Nozzlemen / Salesmen",
    desc: "Simple mobile-first interface for meter readings and shift ops.",
  },
  {
    role: "Accountants",
    desc: "Finance, ledger management, credit customers, and supplier payments.",
  },
];

function UsersSection() {
  return (
    <section className="border-b bg-muted/40 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <Badge variant="outline" className="mb-3">
            Who Is It For
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Designed for Every Role
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Tailored interfaces and permissions for every person at the station.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-3xl gap-4 sm:grid-cols-2">
          {targetUsers.map((u) => (
            <Card key={u.role}>
              <CardHeader>
                <CardTitle className="text-base">{u.role}</CardTitle>
              </CardHeader>
              <CardContent className="-mt-2">
                <p className="text-sm text-muted-foreground">{u.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ================================================================== */
/*  CTA                                                                */
/* ================================================================== */
function CTASection() {
  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/5 to-background" />

      <div className="container relative mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
          Ready to Streamline Your Station?
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
          Join filling station owners across Pakistan who are saving time,
          reducing shortages, and growing their business with Fuel Flow.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" className="gap-2">
            Start 14-Day Free Trial <ChevronRight className="h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline">
            Contact Sales
          </Button>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          No credit card required. Cancel anytime.
        </p>
      </div>
    </section>
  );
}

/* ================================================================== */
/*  Footer                                                             */
/* ================================================================== */
function Footer() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <Fuel className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold">Fuel Flow</span>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Fuel Flow. Built for Pakistan's
            filling station industry.
          </p>
        </div>
        <Separator className="my-4" />
        <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
          <a href="#features" className="hover:text-foreground">
            Features
          </a>
          <a href="#modules" className="hover:text-foreground">
            Modules
          </a>
          <a href="#pricing" className="hover:text-foreground">
            Pricing
          </a>
          <a href="#why" className="hover:text-foreground">
            Why Fuel Flow
          </a>
        </div>
      </div>
    </footer>
  );
}
