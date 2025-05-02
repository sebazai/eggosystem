import { cn } from "@/lib/utils";

export const TablePagination = ({
  currentPage,
  handlePageChange,
  handlePageSizeChange,
  pageSize,
  totalPages,
  totalRows,
  type
}: {
  currentPage: number;
  pageSize: number;
  totalRows: number;
  totalPages: number;
  handlePageSizeChange: (pageSize: number) => void;
  handlePageChange: (page: number) => void;
  type: string;
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-center p-3 border-t border-border gap-4">
      <div className="text-xs text-muted-foreground">
        Showing {Math.min((currentPage - 1) * pageSize + 1, totalRows)} -{" "}
        {Math.min(currentPage * pageSize, totalRows)} of {totalRows} {type}
      </div>
      <div className="flex flex-col xxs:flex-row items-center gap-6">
        <button
          className={cn(
            "px-2 py-1 text-xs rounded border border-border",
            currentPage === 1
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "hover:bg-kanaliiga-light-brown/10"
          )}
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Prev
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
            // Show first page, last page, current page, and pages around current
            let pageToShow = i + 1;
            if (totalPages > 5) {
              if (currentPage <= 3) {
                pageToShow = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageToShow = totalPages - 4 + i;
              } else {
                pageToShow = currentPage - 2 + i;
              }
            }

            return (
              <button
                key={pageToShow}
                className={cn(
                  "w-7 h-7 flex items-center justify-center text-xs rounded",
                  currentPage === pageToShow
                    ? "bg-kanaliiga-orange text-background"
                    : "hover:bg-kanaliiga-light-brown/10"
                )}
                onClick={() => handlePageChange(pageToShow)}
              >
                {pageToShow}
              </button>
            );
          })}
        </div>

        <button
          className={cn(
            "px-2 py-1 text-xs rounded border border-border",
            currentPage === totalPages
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "hover:bg-kanaliiga-light-brown/10"
          )}
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
      <div>
        {/* Page size selector */}
        <select
          className="ml-4 px-2 py-1 text-xs bg-background border border-border rounded"
          value={pageSize}
          onChange={(e) => {
            const newPageSize = parseInt(e.target.value);
            handlePageSizeChange(newPageSize);
          }}
        >
          <option value="10">10 per page</option>
          <option value="20">20 per page</option>
          <option value="50">50 per page</option>
          <option value="100">100 per page</option>
        </select>
      </div>
    </div>
  );
};
