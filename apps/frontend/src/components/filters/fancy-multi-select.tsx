"use client";

// MIT License

// Copyright (c) 2024 Maximilian Kaske

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

// Copied from https://github.com/mxkaske/mxkaske.dev/blob/main/components/craft/fancy-multi-select.tsx
import * as React from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { Command as CommandPrimitive } from "cmdk";
import type { MultiSelect } from "@/types/MultiSelectType";
import { Spinner } from "../icons";

type FancyMultiSelectProps<T> = {
  isMulti: true;
  filter: string;
  selectable: MultiSelect<T>[];
  isValidating: boolean;
  currentSelection: MultiSelect<T>[];
  onSelectChange: (value: MultiSelect<T>[]) => void;
  placeholder?: string;
  isOpen: boolean;
  setOpen: (value: string | null) => void;
  allowOther?: false;
  allowOtherText?: string;
  disabled?: boolean;
};

type FancySelectProps<T> = {
  isMulti: false;
  filter: string;
  selectable: MultiSelect<T>[];
  isValidating: boolean;
  currentSelection: MultiSelect<T>[];
  onSelectChange: (value: MultiSelect<T> | undefined) => void;
  placeholder?: string;
  isOpen: boolean;
  setOpen: (value: string | null) => void;
  allowOther?: boolean;
  allowOtherText?: string;
  disabled?: boolean;
};

type FancyCombinedProps<T> = FancyMultiSelectProps<T> | FancySelectProps<T>;

// Function overloads
export function FancySelect<T>(
  props: FancyMultiSelectProps<T>
): React.JSX.Element;
export function FancySelect<T>(props: FancySelectProps<T>): React.JSX.Element;

// Function implementation
export function FancySelect<T>({
  filter,
  selectable = [],
  isValidating,
  onSelectChange,
  currentSelection = [],
  placeholder = "Filter",
  isOpen,
  setOpen,
  isMulti,
  allowOther = false,
  allowOtherText = "Other...",
  disabled
}: FancyCombinedProps<T>) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = React.useState("");

  const selectables = React.useMemo(
    () =>
      selectable.filter(
        (item) =>
          !currentSelection.some((s) => s.value === item.value) &&
          (item.label.toLowerCase().includes(inputValue.toLowerCase()) ||
            item.searchTerms?.some((term) =>
              term.toLowerCase().includes(inputValue.toLowerCase())
            ))
      ),
    [selectable, currentSelection, inputValue]
  );

  React.useEffect(() => {
    if (inputRef.current && isOpen) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const resetScroll = () => {
    requestAnimationFrame(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current!.scrollTop = 0;
      }
    });
  };

  React.useEffect(() => {
    if (scrollContainerRef.current && isOpen) {
      resetScroll();
    }
  }, [inputValue, isOpen]);

  const handleSelected = React.useCallback(
    (item: MultiSelect<T>) => {
      if (isMulti) {
        onSelectChange([...currentSelection, item]);
      } else {
        onSelectChange(item); // Single selection mode replaces selection
        setOpen(null); // Close dropdown after selecting in single mode
      }
    },
    [onSelectChange, currentSelection, isMulti, setOpen]
  );

  const handleUnselect = React.useCallback(
    (item: MultiSelect<T>) => {
      if (!isMulti) {
        onSelectChange(undefined);
        return;
      }
      onSelectChange(currentSelection.filter((s) => s.value !== item.value));
    },
    [currentSelection, isMulti, onSelectChange]
  );

  const handleClearAll = React.useCallback(() => {
    if (isMulti) {
      onSelectChange([]);
      return;
    }
    onSelectChange(undefined);
  }, [isMulti, onSelectChange]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (inputRef.current) {
        if (
          (e.key === "Delete" || e.key === "Backspace") &&
          inputValue === ""
        ) {
          if (disabled) return;
          if (isMulti && currentSelection.length > 0) {
            const lastSelected = currentSelection[currentSelection.length - 1];
            if (lastSelected) {
              handleUnselect(lastSelected);
            }
          } else {
            if (isMulti) {
              onSelectChange([]);
            } else {
              onSelectChange(undefined);
            }
          }
        }
        if (e.key === "Escape") {
          setOpen(null);
        }
      }
    },
    [
      disabled,
      inputValue,
      isMulti,
      currentSelection,
      handleUnselect,
      setOpen,
      onSelectChange
    ]
  );

  return (
    <Command
      onKeyDown={handleKeyDown}
      className="overflow-visible bg-transparent"
      ref={containerRef}
      shouldFilter={false}
    >
      <div className="group rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        <div className="flex flex-wrap gap-1">
          {isMulti
            ? currentSelection.map((item, index) => (
                <Badge key={`${item.label}-${index}`} variant="secondary">
                  {item.label}
                  <button
                    disabled={disabled}
                    className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 text-muted-foreground hover:text-foreground cursor-pointer disabled:hover:text-muted-foreground disabled:cursor-not-allowed"
                    onClick={() => handleUnselect(item)}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))
            : currentSelection.length > 0 && (
                <Badge variant="secondary">
                  {currentSelection[0]?.label}
                  <button
                    disabled={disabled}
                    className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 text-muted-foreground hover:text-foreground cursor-pointer disabled:hover:text-muted-foreground disabled:cursor-not-allowed"
                    onClick={handleClearAll}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
          <CommandPrimitive.Input
            ref={inputRef}
            value={inputValue}
            disabled={!!disabled}
            onValueChange={(search) => {
              if (!isOpen) {
                setOpen(filter);
              }
              setInputValue(search);
            }}
            onBlur={(e) => {
              if (
                containerRef.current &&
                containerRef.current.contains(e.relatedTarget as Node) &&
                e.relatedTarget !== inputRef.current &&
                inputRef.current
              ) {
                inputRef.current.focus();
                return; // If user selects scrollbar, do nothing
              }
              setOpen(null);
            }}
            onFocus={() => {
              if (!isOpen) {
                setOpen(filter);
              }
            }}
            placeholder={
              (!isMulti && currentSelection.length > 0) ||
              currentSelection.length === selectable.length
                ? ""
                : placeholder
            }
            className="ml-2 flex-1 bg-transparent min-w-[50px] outline-none placeholder:text-muted-foreground"
          />
          <div
            onClick={() => (isOpen ? setOpen(null) : setOpen(filter))}
            className="ml-2 text-muted-foreground hover:text-ring focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded flex items-center cursor-pointer"
          >
            {isValidating && !disabled && (
              <div className="relative">
                <div className="absolute inset-y-0 right-2 flex items-center">
                  <Spinner />
                </div>
              </div>
            )}
            {isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : !disabled ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <></>
            )}
          </div>
        </div>
      </div>
      <div className="relative mt-2">
        <CommandList>
          {isOpen && (
            <div
              ref={scrollContainerRef}
              className="absolute top-0 z-10 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in max-h-50 overflow-y-auto"
            >
              <CommandGroup title="Select an option">
                {isMulti && currentSelection.length > 0 && (
                  <CommandItem
                    key="clear-all"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onSelect={handleClearAll}
                    className="cursor-pointer font-semibold"
                  >
                    Clear filters...
                  </CommandItem>
                )}
                {allowOther && (
                  <CommandItem
                    key="other"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onSelect={() => {
                      setInputValue("");
                      handleSelected({ label: "Other", value: -1 as T });
                    }}
                    className="cursor-pointer"
                  >
                    {allowOtherText}
                  </CommandItem>
                )}

                {selectables.map((item, index) => (
                  <CommandItem
                    key={`${item.label}-${index}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onSelect={() => {
                      setInputValue("");
                      handleSelected(item);
                    }}
                    className="cursor-pointer"
                  >
                    {item.label}
                  </CommandItem>
                ))}

                {!selectables.length && inputValue && (
                  <CommandItem
                    key="no-result"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onSelect={() => {
                      setInputValue("");
                    }}
                    className="cursor-pointer"
                  >
                    No results (Clear search)
                  </CommandItem>
                )}
              </CommandGroup>
            </div>
          )}
        </CommandList>
      </div>
    </Command>
  );
}
