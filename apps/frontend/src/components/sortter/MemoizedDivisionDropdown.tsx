import React, { memo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator
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
  onAddNewDivision?: () => void;
  originalValue: number | null;
}

const MemoizedDivisionDropdown = memo(
  ({
    teamId,
    value,
    options,
    disabled = false,
    onValueChange,
    onAddNewDivision,
    originalValue
  }: MemoizedDivisionDropdownProps) => {
    // Handle value change locally to avoid re-renders
    const handleValueChange = (newValue: string) => {
      // Check if this is the "add-new" special value
      if (newValue === "add-new") {
        if (onAddNewDivision) {
          onAddNewDivision();
        }
        return;
      }
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
          {!disabled && onAddNewDivision && (
            <>
              <SelectSeparator />
              <SelectItem value="add-new" className="text-primary font-medium">
                + Add New Division
              </SelectItem>
            </>
          )}
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
      prevProps.options.length === nextProps.options.length &&
      prevProps.onAddNewDivision === nextProps.onAddNewDivision
    );
  }
);

// Add display name for debugging
MemoizedDivisionDropdown.displayName = "MemoizedDivisionDropdown";

export default MemoizedDivisionDropdown;
