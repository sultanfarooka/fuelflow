/**
 * [M08-F07-R06] Reusable navigation card for the Station Configuration hub.
 * Renders an iOS-Settings / Monzo-Payments-style row: a Tabler icon in a
 * tinted badge, a title, a one-line description, and a chevron that nudges
 * forward on hover. Wrapped in a TanStack Router `<Link>` so the whole row
 * is clickable + keyboard-focusable.
 *
 * Pattern mirrors `routes/dashboard/index.tsx`'s station-card list, extracted
 * here so the hub and future menus reuse one definition.
 */
import { Link } from "@tanstack/react-router"
import { IconChevronRight, type Icon } from "@tabler/icons-react"

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface ConfigMenuCardProps {
  /** TanStack Router target path (with `$param` placeholders resolved by `params`). */
  to: string
  /** Route params, e.g. `{ stationId }`. */
  params?: Record<string, string>
  /** Tabler icon component shown in the start-side badge. */
  icon: Icon
  /** Card title — shown in the row's primary text. */
  title: string
  /** One-line description shown beneath the title. */
  description: string
}

export function ConfigMenuCard({
  to,
  params,
  icon: ItemIcon,
  title,
  description,
}: ConfigMenuCardProps) {
  return (
    <Link
      to={to}
      params={params}
      className="group block rounded-xl outline-none transition-opacity hover:opacity-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Card className="transition-shadow group-hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ItemIcon className="size-5" />
            </span>
            <div className="space-y-0.5">
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          <IconChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
        </CardHeader>
      </Card>
    </Link>
  )
}
