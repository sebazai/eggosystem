"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { convertSteamIdToSteamId64, isValidSteamId } from "@/lib/utils";
import type { ComponentProps } from "react";

interface SteamIdInputProps
  extends Omit<ComponentProps<typeof Input>, "onChange" | "value"> {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  onConverted?: (convertedSteamId: string) => void;
  convertOnBlur?: boolean;
  showLoadingState?: boolean;
  "data-testid"?: string;
}

/**
 * Reusable Steam ID input component that automatically converts
 * Steam IDs to SteamID64 format.
 *
 * Supports:
 * - SteamID64 (17 digits)
 * - SteamID (STEAM_X:Y:Z)
 * - SteamID3 ([U:1:AccountID])
 * - Steam profile URLs (/profiles/SteamID64)
 * - Custom Steam URLs (via API call)
 *
 * Conversion happens automatically on blur or when the value changes
 * (if convertOnBlur is false).
 */
export function SteamIdInput({
  value,
  onChange,
  label,
  onConverted,
  convertOnBlur = true,
  showLoadingState = true,
  className,
  disabled,
  "data-testid": testId = "steam-id-input",
  ...props
}: SteamIdInputProps) {
  const [isConverting, setIsConverting] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  // Sync local value with prop value
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleConversion = async (inputValue: string) => {
    // Skip empty values
    if (!inputValue.trim()) {
      onChange("");
      onConverted?.("");
      return;
    }

    // If already valid SteamID64, no conversion needed
    if (isValidSteamId(inputValue.trim())) {
      onChange(inputValue.trim());
      onConverted?.(inputValue.trim());
      return;
    }

    // Attempt conversion
    setIsConverting(true);
    try {
      const converted = await convertSteamIdToSteamId64(inputValue);
      onChange(converted);
      onConverted?.(converted);
    } catch (error) {
      // If conversion fails, keep the original value
      // Validation will catch invalid formats later
      console.warn("Steam ID conversion failed:", error);
      onChange(inputValue);
    } finally {
      setIsConverting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);

    // If convertOnBlur is false, convert immediately
    if (!convertOnBlur && newValue.trim()) {
      handleConversion(newValue);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Call original onBlur if provided (for react-hook-form)
    props.onBlur?.(e);

    if (convertOnBlur && localValue.trim()) {
      handleConversion(localValue);
    }
  };

  const inputElement = (
    <div className="relative">
      <Input
        {...props}
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled || isConverting}
        className={cn(showLoadingState && isConverting && "pr-8", className)}
        data-testid={testId}
      />
      {showLoadingState && isConverting && (
        <Loader2
          className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground"
          data-testid={`${testId}-loading`}
        />
      )}
    </div>
  );

  if (label) {
    return (
      <div className="space-y-2">
        <Label htmlFor={props.id || testId}>{label}</Label>
        {inputElement}
      </div>
    );
  }

  return inputElement;
}
