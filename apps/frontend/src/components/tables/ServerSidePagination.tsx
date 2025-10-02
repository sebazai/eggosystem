import { Button } from "@/components/ui/button";

interface ServerSidePaginationProps {
  currentPage: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
  onPageChange: (page: number) => void;
  className?: string;
}

export const ServerSidePagination = ({
  currentPage,
  pageSize,
  total,
  hasMore,
  onPageChange,
  className = ""
}: ServerSidePaginationProps) => {
  if (total <= pageSize) {
    return null;
  }

  const startItem = currentPage * pageSize + 1;
  const endItem = Math.min((currentPage + 1) * pageSize, total);

  return (
    <div className={`flex items-center justify-between mt-6 ${className}`}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        Showing {startItem} to {endItem} of {total} items
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(0, currentPage - 1))}
          disabled={currentPage === 0}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasMore}
        >
          Next
        </Button>
      </div>
    </div>
  );
};
