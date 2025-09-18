"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip";
import {
  flexRender,
  type Table,
  type ColumnDef,
  type Cell
} from "@tanstack/react-table";
import { TablePagination } from "./TablePagination";

interface CustomColumnMeta {
  responsive?: string;
  tooltip?: string;
  sortable?: boolean;
}

interface BaseTableProps<TData> {
  table: Table<TData>;
  columns?: ColumnDef<TData>[];
  onRowClick?: (row: TData) => void;
  onRowMiddleClick?: (row: TData) => void;
  showPagination?: boolean;
  paginationType?: string;
  customRowClassName?: (row: TData) => string;
  customCellClassName?: (cell: Cell<TData, unknown>, row: TData) => string;
  mobileHeaders?: React.ReactNode;
  customCellContent?: (
    cell: Cell<TData, unknown>,
    row: TData
  ) => React.ReactNode;
}

export function BaseTable<TData>({
  table,
  onRowClick,
  onRowMiddleClick,
  showPagination = true,
  paginationType = "default",
  customRowClassName,
  customCellClassName,
  mobileHeaders,
  customCellContent
}: BaseTableProps<TData>) {
  return (
    <TooltipProvider>
      <div className="bg-card overflow-hidden">
        <div className="overflow-auto">
          <table className="text-sm sm:text-base w-full">
            <thead>
              {/* Desktop headers */}
              <tr className="hidden bg-kanaliiga-light-brown/30 sm:table-row uppercase text-kanaliiga-orange">
                {table.getHeaderGroups().map((headerGroup) =>
                  headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={cn(
                        "px-3 py-2 text-center whitespace-nowrap font-semibold",
                        header.id === "opponent_name" && "text-left",
                        (header.column.columnDef.meta as CustomColumnMeta)
                          ?.responsive,
                        (header.column.columnDef.meta as CustomColumnMeta)
                          ?.sortable &&
                          "cursor-pointer hover:bg-kanaliiga-orange/50"
                      )}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center justify-center">
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                            {(header.column.columnDef.meta as CustomColumnMeta)
                              ?.sortable && (
                              <span className="inline-block ml-1">
                                {{
                                  asc: <ChevronUp className="h-4 w-4" />,
                                  desc: <ChevronDown className="h-4 w-4" />
                                }[header.column.getIsSorted() as string] ??
                                  null}
                              </span>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          className="px-2 py-1 text-xs"
                        >
                          {(header.column.columnDef.meta as CustomColumnMeta)
                            ?.tooltip || header.id}
                        </TooltipContent>
                      </Tooltip>
                    </th>
                  ))
                )}
              </tr>

              {/* Mobile headers */}
              {mobileHeaders}
            </thead>
            <tbody className="divide-y divide-kanaliiga-light-brown/10">
              {table.getRowModel().rows.map((row) => {
                const rowClassName = customRowClassName
                  ? customRowClassName(row.original)
                  : "hover:bg-kanaliiga-light-brown/10 cursor-pointer";

                return (
                  <tr
                    key={row.id}
                    className={rowClassName}
                    onClick={() => onRowClick?.(row.original)}
                    onMouseDown={(e) => {
                      // Handle middle mouse button (wheel) click
                      if (e.button === 1) {
                        e.preventDefault();
                        onRowMiddleClick?.(row.original);
                      }
                    }}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const cellClassName = customCellClassName
                        ? customCellClassName(cell, row.original)
                        : cn(
                            "px-3 py-2 text-center",
                            (cell.column.columnDef.meta as CustomColumnMeta)
                              ?.responsive,
                            cell.column.id === "opponent_name" && "text-left",
                            cell.column.id === "kana_rating" && "font-bold"
                          );

                      return (
                        <td key={cell.id} className={cellClassName}>
                          {customCellContent
                            ? customCellContent(cell, row.original)
                            : flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {showPagination && table.getFilteredRowModel().rows.length > 0 && (
          <TablePagination
            totalRows={table.getFilteredRowModel().rows.length}
            currentPage={table.getState().pagination.pageIndex + 1}
            totalPages={table.getPageCount()}
            handlePageChange={(page) => table.setPageIndex(page - 1)}
            handlePageSizeChange={(newPageSize) => {
              table.setPageSize(newPageSize);
              table.setPageIndex(0);
            }}
            pageSize={table.getState().pagination.pageSize}
            type={paginationType}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
