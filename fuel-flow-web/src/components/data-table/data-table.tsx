/**
 * Shared, reusable DataTable (M07 platform UI) — the project-wide standard for
 * tabular data. Built on TanStack Table (headless) + shadcn primitives only.
 *
 * Responsibilities, all opt-in via props:
 *  - Global search, faceted column filters, column sorting, column visibility
 *  - Client-side pagination
 *  - Responsive layout: a full table on `md+` screens, and a stacked list of
 *    cards on smaller screens (caller supplies `renderMobileCard`)
 *  - Loading skeletons and an empty state
 *
 * Columns carry presentation hints through `column.meta` (see the module
 * augmentation below): `title` (human label for the view-options menu),
 * `align`, and per-cell/header className overrides.
 *
 * This component is intentionally generic — reuse it for every future list
 * screen (users, customers, suppliers, transactions, …) by passing a
 * `ColumnDef[]` and, optionally, a `renderMobileCard`.
 */
import { useState } from "react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type Row,
  type RowData,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DataTableToolbar,
  type DataTableFilterDef,
} from "@/components/data-table/data-table-toolbar"
import { DataTablePagination } from "@/components/data-table/data-table-pagination"
import { cn } from "@/lib/utils"

declare module "@tanstack/react-table" {
  // The augmented signature must keep TData/TValue to merge with the base
  // interface even though this declaration doesn't reference them.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    /** Human label used by the column-visibility menu. */
    title?: string
    /** Horizontal alignment for the header + cells. */
    align?: "start" | "end" | "center"
    headerClassName?: string
    cellClassName?: string
  }
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  isLoading?: boolean
  /** Global search box. Set `enableSearch={false}` to hide it. */
  enableSearch?: boolean
  searchPlaceholder?: string
  /** Faceted (multi-select) filters keyed by column id. */
  filters?: DataTableFilterDef[]
  /** Right-aligned toolbar slot (e.g. a primary "Add" button). */
  toolbarActions?: React.ReactNode
  /** Card renderer for the < md breakpoint. Omit to keep the table everywhere. */
  renderMobileCard?: (row: Row<TData>) => React.ReactNode
  /** Shown when there are zero rows (before any filtering). */
  emptyState?: React.ReactNode
  /** Optional per-row className for the desktop table row (e.g. mute inactive). */
  rowClassName?: (row: Row<TData>) => string | undefined
  /** Min width for the desktop table so columns stay legible (it scrolls). */
  minWidthClassName?: string
  initialPageSize?: number
  initialSorting?: SortingState
  getRowId?: (row: TData) => string
}

const alignClass = (align?: "start" | "end" | "center") =>
  align === "end" ? "text-end" : align === "center" ? "text-center" : undefined

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  enableSearch = true,
  searchPlaceholder,
  filters,
  toolbarActions,
  renderMobileCard,
  emptyState,
  rowClassName,
  minWidthClassName = "min-w-[640px]",
  initialPageSize = 10,
  initialSorting = [],
  getRowId,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>(initialSorting)
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [globalFilter, setGlobalFilter] = useState("")

  // TanStack Table returns fresh function instances each render; the React
  // Compiler can't memoize it and prints an informational notice — expected.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, columnVisibility, globalFilter },
    initialState: { pagination: { pageSize: initialPageSize } },
    getRowId,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  const rows = table.getRowModel().rows
  const hasRows = rows.length > 0
  const noData = !isLoading && data.length === 0

  const defaultEmpty = (
    <p className="px-6 py-12 text-center text-sm text-muted-foreground">
      No results.
    </p>
  )

  return (
    <div className="flex flex-col">
      <DataTableToolbar
        table={table}
        enableSearch={enableSearch}
        searchPlaceholder={searchPlaceholder}
        filters={filters}
        actions={toolbarActions}
      />

      <div className="border-t border-border">
        {/* ── Desktop: full table ─────────────────────────────────────── */}
        <div className={cn(renderMobileCard ? "hidden md:block" : "block")}>
          <Table className={minWidthClassName}>
            <TableHeader className="bg-muted/60 [&_th]:font-semibold [&_th]:text-foreground">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="hover:bg-muted/60 [&_th:first-child]:ps-6 [&_th:last-child]:pe-6"
                >
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className={cn(
                        alignClass(header.column.columnDef.meta?.align),
                        header.column.columnDef.meta?.headerClassName
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className="[&_td:first-child]:ps-6 [&_td:last-child]:pe-6">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    {table.getVisibleLeafColumns().map((col) => (
                      <TableCell key={col.id} className="py-3.5">
                        <Skeleton className="h-4 w-full max-w-32" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : hasRows ? (
                rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={rowClassName?.(row)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          "py-3",
                          alignClass(cell.column.columnDef.meta?.align),
                          cell.column.columnDef.meta?.cellClassName
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={table.getVisibleLeafColumns().length}>
                    {noData ? (emptyState ?? defaultEmpty) : defaultEmpty}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* ── Mobile: card list ───────────────────────────────────────── */}
        {renderMobileCard && (
          <div className="md:hidden">
            {isLoading ? (
              <div className="grid gap-3 p-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={`m-skeleton-${i}`} className="h-28 w-full rounded-xl" />
                ))}
              </div>
            ) : hasRows ? (
              <div className="grid gap-3 p-4">
                {rows.map((row) => (
                  <div key={row.id}>{renderMobileCard(row)}</div>
                ))}
              </div>
            ) : noData ? (
              (emptyState ?? defaultEmpty)
            ) : (
              defaultEmpty
            )}
          </div>
        )}
      </div>

      {(hasRows || isLoading) && (
        <div className="border-t border-border">
          <DataTablePagination table={table} pageSizeOptions={[10, 20, 30, 50]} />
        </div>
      )}
    </div>
  )
}
