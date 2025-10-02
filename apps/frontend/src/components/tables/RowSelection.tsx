interface RowSelectionProps {
  isSelected: boolean;
  onToggle: (event?: unknown) => void;
  isIndeterminate?: boolean;
  className?: string;
}

export const RowSelection = ({
  isSelected,
  onToggle,
  isIndeterminate = false,
  className = ""
}: RowSelectionProps) => {
  return (
    <input
      type="checkbox"
      checked={isSelected}
      onChange={onToggle}
      ref={(el) => {
        if (el) el.indeterminate = isIndeterminate;
      }}
      className={`w-4 h-4 ${className}`}
    />
  );
};
