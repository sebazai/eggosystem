import React, { memo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface MemoizedDivisionDropdownProps {
  teamId: number;
  value: string;
  options: { value: number; label: string }[];
  disabled?: boolean;
  onValueChange: (
    teamId: number,
    value: number,
    originalValue: number | null
  ) => void;
  originalValue: number | null;
}

const MemoizedDivisionDropdown = memo(
  ({
    teamId,
    value,
    options,
    disabled = false,
    onValueChange,
    originalValue
  }: MemoizedDivisionDropdownProps) => {
    // Handle value change locally to avoid re-renders
    const handleValueChange = (newValue: string) => {
      onValueChange(teamId, parseInt(newValue, 10), originalValue);
    };

    return (
      <Select
        value={value}
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-36 h-10 text-sm">
          <SelectValue placeholder="Division" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value.toString()}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  },
  // Custom comparison function to prevent unnecessary re-renders
  (prevProps, nextProps) => {
    return (
      prevProps.value === nextProps.value &&
      prevProps.disabled === nextProps.disabled &&
      prevProps.teamId === nextProps.teamId &&
      prevProps.options.length === nextProps.options.length
    );
  }
);

// Add display name for debugging
MemoizedDivisionDropdown.displayName = "MemoizedDivisionDropdown";

export default MemoizedDivisionDropdown;
