/**
 * [M08-F07-R06] Reusable navigation row for the Station Configuration hub.
 * Flat soft-gray surface (no card border / shadow), outline icon at the
 * start, title + one-line description, chevron at the end. Matches the
 * iOS-Settings / Monzo-Payments visual pattern.
 *
 * Wrapped in a TanStack Router `<Link>` so the whole row is clickable and
 * keyboard-focusable.
 */
import { Link } from "@tanstack/react-router"
import { IconChevronRight, type Icon } from "@tabler/icons-react"

interface ConfigMenuCardProps {
  /** TanStack Router target path (with `$param` placeholders resolved by `params`). */
  to: string
  /** Route params, e.g. `{ stationId }`. */
  params?: Record<string, string>
  /** Tabler icon component shown at the start of the row. */
  icon: Icon
  /** Row title — primary text, semibold. */
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
      className="group block rounded-2xl bg-muted/60 p-5 outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="flex items-center gap-4">
        <ItemIcon
          className="size-6 shrink-0 text-foreground"
          stroke={1.75}
        />
        <div className="min-w-0 flex-1">
          <div className="text-base font-semibold text-foreground">
            {title}
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        </div>
        <IconChevronRight
          className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
          stroke={1.75}
        />
      </div>
    </Link>
  )
}
