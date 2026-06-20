/**
 * Toolbar for the shared DataTable (M07 platform UI).
 *
 * Left: a debounced-free global search box (filters across the table's
 * searchable columns). Then any faceted filters and a "Reset" button that
 * appears only when a filter/search is active. Right: column view options
 * plus a caller-supplied `actions` slot (e.g. an "Add" button).
 */
import type { Table } from "@tanstack/react-table"
import { IconSearch, IconX } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DataTableFacetedFilter,
  type DataTableFilterOption,
} from "@/components/data-table/data-table-faceted-filter"
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options"

export interface DataTableFilterDef {
  columnId: string
  title: string
  options: DataTableFilterOption[]
}

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  searchPlaceholder?: string
  enableSearch?: boolean
  filters?: DataTableFilterDef[]
  actions?: React.ReactNode
}

export function DataTableToolbar<TData>({
  table,
  searchPlaceholder = "Search…",
  enableSearch = true,
  filters = [],
  actions,
}: DataTableToolbarProps<TData>) {
  const globalFilter = (table.getState().globalFilter as string) ?? ""
  const isFiltered =
    table.getState().columnFilters.length > 0 || globalFilter.length > 0

  return (
    <div className="flex flex-col gap-3 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {enableSearch && (
          <div className="relative w-full sm:w-64">
            <IconSearch
              className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              stroke={1.75}
              aria-hidden
            />
            <Input
              value={globalFilter}
              onChange={(e) => table.setGlobalFilter(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 w-full ps-9"
              aria-label={searchPlaceholder}
            />
          </div>
        )}

        {filters.map((filter) => (
          <DataTableFacetedFilter
            key={filter.columnId}
            column={table.getColumn(filter.columnId)}
            title={filter.title}
            options={filter.options}
          />
        ))}

        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9"
            onClick={() => {
              table.resetColumnFilters()
              table.setGlobalFilter("")
            }}
          >
            Reset
            <IconX className="size-4" />
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <DataTableViewOptions table={table} />
        {actions}
      </div>
    </div>
  )
}
