/**
 * Shared DataTable — the project-wide standard for tabular list screens.
 * Built on TanStack Table (headless) + shadcn primitives only. See
 * `data-table.tsx` for the full contract and usage notes.
 */
export { DataTable } from "@/components/data-table/data-table"
export { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
export { DataTablePagination } from "@/components/data-table/data-table-pagination"
export { DataTableViewOptions } from "@/components/data-table/data-table-view-options"
export {
  DataTableFacetedFilter,
  type DataTableFilterOption,
} from "@/components/data-table/data-table-faceted-filter"
export {
  DataTableToolbar,
  type DataTableFilterDef,
} from "@/components/data-table/data-table-toolbar"
