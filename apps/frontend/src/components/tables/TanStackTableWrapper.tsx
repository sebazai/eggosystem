"use client";

import React from "react";
import {
  useReactTable,
  getCoreRowModel as getCoreRowModelFn,
  getSortedRowModel as getSortedRowModelFn,
  getPaginationRowModel as getPaginationRowModelFn,
  getExpandedRowModel as getExpandedRowModelFn,
  getFilteredRowModel as getFilteredRowModelFn,
  type ColumnDef,
  type TableOptions,
  type SortingState,
  type PaginationState,
  type RowSelectionState,
  type OnChangeFn,
  type Cell
} from "@tanstack/react-table";
import { BaseTable } from "./BaseTable";

// BaseTable props that can be passed through (excluding table)
interface BaseTablePassThroughProps<TData> {
  columns?: ColumnDef<TData>[];
  onRowClick?: (row: TData) => void;
  onRowMiddleClick?: (row: TData) => void;
  showPagination?: boolean;
  paginationType?: string;
  customRowClassName?: (row: TData) => string;
  customCellClassName?: (cell: Cell<TData, unknown>, row: TData) => string;
  customCellContent?: (
    cell: Cell<TData, unknown>,
    row: TData
  ) => React.ReactNode;
  customPagination?: React.ReactNode;
  enableRowExpansion?: boolean;
  renderExpandedRow?: (row: TData) => React.ReactNode;
  // Note: enableRowSelection is handled via table options, not BaseTable prop
}

// Define the table configuration props
interface TanStackTableWrapperProps<
  TData
> extends BaseTablePassThroughProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  // Row models
  getCoreRowModel?: ReturnType<typeof getCoreRowModelFn>;
  getSortedRowModel?: ReturnType<typeof getSortedRowModelFn>;
  getPaginationRowModel?: ReturnType<typeof getPaginationRowModelFn>;
  getExpandedRowModel?: ReturnType<typeof getExpandedRowModelFn>;
  getFilteredRowModel?: ReturnType<typeof getFilteredRowModelFn>;
  // State management
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  pagination?: PaginationState;
  onPaginationChange?: OnChangeFn<PaginationState>;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  // Other table options
  getRowId?: TableOptions<TData>["getRowId"];
  enableRowSelection?: TableOptions<TData>["enableRowSelection"];
  getRowCanExpand?: TableOptions<TData>["getRowCanExpand"];
  initialState?: TableOptions<TData>["initialState"];
  debugTable?: TableOptions<TData>["debugTable"];
  globalFilterFn?: TableOptions<TData>["globalFilterFn"];
  onGlobalFilterChange?: TableOptions<TData>["onGlobalFilterChange"];
  state?: TableOptions<TData>["state"];
  // Callback to get table instance for advanced use cases
  onTableReady?: (table: ReturnType<typeof useReactTable<TData>>) => void;
}

export function TanStackTableWrapper<TData>({
  data,
  columns,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  sorting,
  onSortingChange,
  pagination,
  onPaginationChange,
  rowSelection,
  onRowSelectionChange,
  getRowId,
  enableRowSelection,
  getRowCanExpand,
  initialState,
  debugTable,
  globalFilterFn,
  onGlobalFilterChange,
  state,
  onTableReady,
  ...baseTableProps
}: TanStackTableWrapperProps<TData>) {
  // Build the state object, merging provided state with individual state props
  const tableState = React.useMemo(() => {
    const mergedState: TableOptions<TData>["state"] = {
      ...state,
      ...(sorting !== undefined && { sorting }),
      ...(pagination !== undefined && { pagination }),
      ...(rowSelection !== undefined && { rowSelection })
    };
    return Object.keys(mergedState).length > 0 ? mergedState : undefined;
  }, [state, sorting, pagination, rowSelection]);

  // TanStack Table configuration
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable<TData>({
    data,
    columns,
    getCoreRowModel: getCoreRowModel ?? getCoreRowModelFn(),
    ...(getSortedRowModel && { getSortedRowModel }),
    ...(getPaginationRowModel && { getPaginationRowModel }),
    ...(getExpandedRowModel && { getExpandedRowModel }),
    ...(getFilteredRowModel && { getFilteredRowModel }),
    ...(onSortingChange && { onSortingChange }),
    ...(onPaginationChange && { onPaginationChange }),
    ...(onRowSelectionChange && { onRowSelectionChange }),
    ...(getRowId && { getRowId }),
    ...(enableRowSelection !== undefined && { enableRowSelection }),
    ...(getRowCanExpand && { getRowCanExpand }),
    ...(initialState && { initialState }),
    ...(debugTable !== undefined && { debugTable }),
    ...(globalFilterFn && { globalFilterFn }),
    ...(onGlobalFilterChange && { onGlobalFilterChange }),
    ...(tableState && { state: tableState })
  });

  // Expose table instance via callback if needed
  React.useEffect(() => {
    onTableReady?.(table);
  }, [table, onTableReady]);

  return <BaseTable table={table} {...baseTableProps} />;
}
