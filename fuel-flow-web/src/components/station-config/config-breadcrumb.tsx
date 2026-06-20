/**
 * [M08-F07-R06] Lightweight breadcrumb for the Station Configuration hub and
 * its child pages. Inline implementation (no new shadcn primitive) — accepts
 * an ordered list where the last entry is the current page (rendered as
 * foreground text, not a link) and earlier entries are links.
 *
 * RTL: the chevron uses Tabler's `IconChevronRight` and we mirror it with
 * `rtl:rotate-180` so it points start→end under both ltr and rtl.
 */
import { Link } from "@tanstack/react-router"
import { IconChevronRight } from "@tabler/icons-react"

export interface BreadcrumbItem {
  label: string
  /** TanStack Router target path. Omit for the current page. */
  to?: string
  /** Route params, e.g. `{ stationId }`. */
  params?: Record<string, string>
}

export function ConfigBreadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-sm">
      <ol className="flex flex-wrap items-center gap-1.5 text-muted-foreground">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1
          return (
            <li key={`${item.label}-${idx}`} className="flex items-center gap-1.5">
              {item.to && !isLast ? (
                <Link
                  to={item.to}
                  params={item.params}
                  className="rounded outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={isLast ? "font-medium text-foreground" : undefined}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
              {!isLast && (
                <IconChevronRight
                  className="size-4 shrink-0 text-muted-foreground/70 rtl:rotate-180"
                  stroke={1.75}
                  aria-hidden
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
