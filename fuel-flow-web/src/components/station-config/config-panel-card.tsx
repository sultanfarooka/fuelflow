/**
 * [M08-F08, M06-F01] Shared shell for Station Configuration panels.
 *
 * Renders a `<Card overflow-hidden>` with the conventional header (icon +
 * title + description on the start, primary-action slot on the end) and
 * a flush `<CardContent p-0>` so child tables / DataTables extend
 * edge-to-edge. The first / last cells of the inner table are responsible
 * for their own `ps-6` / `pe-6` padding to line up with the title above.
 *
 * Use this for every list-screen panel under Station Configuration —
 * Fuel Types, Fuel Pricing, future Tanks / Nozzles — so the chrome is
 * enforced by reuse, not by copy-paste discipline. Per
 * `components/CLAUDE.md` "Shared DataTable" section: do NOT hand-roll a
 * <Card> in a new panel; compose this.
 */
import type { ReactNode } from "react"
import type { Icon } from "@tabler/icons-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface ConfigPanelCardProps {
  /** Tabler icon for the header — sized at `size-5 text-primary`. */
  icon: Icon
  /** Header title (English literal — i18n sweep tracked under M08-F05-R05). */
  title: string
  /** One-line description shown beneath the title. */
  description: string
  /** Primary action button(s) on the inline-end of the header. Optional. */
  action?: ReactNode
  /**
   * Body content — typically a `<DataTable />`. Goes into `CardContent`
   * with `p-0` so the inner table sits flush against the card edges.
   */
  children: ReactNode
}

export function ConfigPanelCard({
  icon: HeaderIcon,
  title,
  description,
  action,
  children,
}: ConfigPanelCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <CardTitle className="flex items-center gap-2">
            <HeaderIcon className="size-5 shrink-0 text-primary" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </CardHeader>

      <CardContent className="p-0">{children}</CardContent>
    </Card>
  )
}
