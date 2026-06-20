/**
 * Sortable column header for the shared DataTable (M07 platform UI).
 *
 * Non-sortable columns render plain text. Sortable columns render a ghost
 * button that opens a small menu (Asc / Desc / Hide) and shows the current
 * sort direction inline — the canonical shadcn data-table header pattern,
 * adapted to our Tabler icon set + RTL-safe logical utilities.
 */
import type { Column } from "@tanstack/react-table"
import {
  IconArrowDown,
  IconArrowUp,
  IconEyeOff,
  IconSelector,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>
  title: string
  align?: "start" | "end"
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  align = "start",
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return (
      <div className={cn(align === "end" && "text-end", className)}>{title}</div>
    )
  }

  const sorted = column.getIsSorted()

  return (
    <div
      className={cn(
        "flex items-center",
        align === "end" && "justify-end",
        className
      )}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="-ms-2.5 h-8 data-[state=open]:bg-accent"
          >
            <span>{title}</span>
            {sorted === "desc" ? (
              <IconArrowDown className="size-3.5" />
            ) : sorted === "asc" ? (
              <IconArrowUp className="size-3.5" />
            ) : (
              <IconSelector className="size-3.5 text-muted-foreground" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align === "end" ? "end" : "start"}>
          <DropdownMenuItem onSelect={() => column.toggleSorting(false)}>
            <IconArrowUp className="size-4 text-muted-foreground" />
            Ascending
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => column.toggleSorting(true)}>
            <IconArrowDown className="size-4 text-muted-foreground" />
            Descending
          </DropdownMenuItem>
          {column.getCanHide() && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => column.toggleVisibility(false)}>
                <IconEyeOff className="size-4 text-muted-foreground" />
                Hide
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
