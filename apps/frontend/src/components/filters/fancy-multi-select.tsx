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
import type { Nullable } from "../../../../../packages/types/src";
import type { MultiSelect } from "@/types/MultiSelectType";

interface FancyMultiSelectProps {
  filter: string;
  selectable?: MultiSelect[];
  currentSelection?: MultiSelect[];
  onSelectChange: (value: MultiSelect[]) => void;
  placeholder?: string;
  isOpen: boolean;
  setOpen: (value: Nullable<string>) => void;
}

export function FancyMultiSelect({
  filter,
  selectable,
  onSelectChange,
  currentSelection = [],
  placeholder = "Filter",
  isOpen,
  setOpen
}: FancyMultiSelectProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = React.useState("");

  React.useEffect(() => {
    if (inputRef.current && isOpen) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelected = React.useCallback(
    (framework: MultiSelect) => {
      onSelectChange([...currentSelection, framework]);
    },
    [onSelectChange, currentSelection]
  );

  const handleUnselect = React.useCallback(
    (framework: MultiSelect) => {
      onSelectChange(
        currentSelection.filter((s) => s.value !== framework.value)
      );
    },
    [currentSelection, onSelectChange]
  );

  const handleClearAll = React.useCallback(() => {
    onSelectChange([]);
  }, [onSelectChange]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const input = inputRef.current;
      if (input) {
        if (e.key === "Delete" || e.key === "Backspace") {
          if (input.value === "") {
            const remove = currentSelection.pop();
            if (remove) {
              handleUnselect(remove);
            }
          }
        }
        if (e.key === "Escape") {
          input.blur();
        }
      }
    },
    [handleUnselect, currentSelection]
  );

  const selectables = selectable?.filter(
    (framework) => !currentSelection.some((s) => s.value === framework.value)
  );

  return (
    <Command
      onKeyDown={handleKeyDown}
      className="overflow-visible bg-transparent"
      ref={containerRef}
    >
      <div className="group rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        <div className="flex flex-wrap gap-1">
          {currentSelection.map((framework) => {
            return (
              <Badge key={framework.value} variant="secondary">
                {framework.label}
                <button
                  className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleUnselect(framework);
                    }
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={() => handleUnselect(framework)}
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              </Badge>
            );
          })}
          <CommandPrimitive.Input
            ref={inputRef}
            value={inputValue}
            onValueChange={setInputValue}
            onBlur={(e) => {
              if (
                containerRef.current &&
                containerRef.current.contains(e.relatedTarget as Node)
              ) {
                return; // If user selects scrollbar, do nothing
              }
              setOpen(null);
            }}
            onFocus={() => {
              if (!isOpen) {
                setOpen(filter);
              }
            }}
            placeholder={placeholder}
            className="ml-2 flex-1 bg-transparent min-w-[50px] outline-none placeholder:text-muted-foreground"
          />
          <div
            onClick={() => (isOpen ? setOpen(null) : setOpen(filter))}
            className="ml-2 text-muted-foreground hover:text-ring focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded flex items-center cursor-pointer"
          >
            {isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        </div>
      </div>
      <div className="relative mt-2">
        <CommandList>
          {isOpen && (
            <div className="absolute top-0 z-10 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in max-h-50 overflow-y-auto">
              <CommandGroup>
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
                {selectables?.map((framework) => (
                  <CommandItem
                    key={framework.value}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onSelect={() => {
                      setInputValue("");
                      handleSelected(framework);
                    }}
                    className="cursor-pointer"
                  >
                    {framework.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </div>
          )}
        </CommandList>
      </div>
    </Command>
  );
}
