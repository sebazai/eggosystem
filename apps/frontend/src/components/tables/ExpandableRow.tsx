import { ChevronDown, ChevronRight } from "lucide-react";

interface ExpandableRowProps {
  isExpanded: boolean;
  onToggle: () => void;
  canExpand: boolean;
  className?: string;
}

export const ExpandableRow = ({
  isExpanded,
  onToggle,
  canExpand,
  className = ""
}: ExpandableRowProps) => {
  if (!canExpand) {
    return null;
  }

  return (
    <button
      className={`flex items-center justify-center w-6 h-6 ${className}`}
      onClick={onToggle}
      aria-label={isExpanded ? "Collapse" : "Expand"}
    >
      {isExpanded ? (
        <ChevronDown className="w-4 h-4" />
      ) : (
        <ChevronRight className="w-4 h-4" />
      )}
    </button>
  );
};
