"use client";

import { Input } from "@/components/ui/input";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { SelectSpinner } from "@/components/ui/icons";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export function SearchBar({ placeholder }: { placeholder: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Calculate URL search value during render (React best practice)
  const urlSearchValue = searchParams.get("q") || "";

  // Store pending user input in state (for debouncing)
  // Calculate effective value during render: use pending input if exists, otherwise URL value
  const [pendingInput, setPendingInput] = useState<string | null>(null);
  const searchValue = pendingInput ?? urlSearchValue;

  const [isPending, startTransition] = useTransition();
  const [showInput, setShowInput] = useState(false);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobile = useIsMobile();
  const isUpdatingUrlRef = useRef(false);

  useEffect(() => {
    if (!isPending && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isPending]);

  // Clear pending input when URL changes externally (not from our update)
  // This syncs the input with URL params without setState in Effect
  useEffect(() => {
    if (
      !isUpdatingUrlRef.current &&
      urlSearchValue !== pendingInput &&
      pendingInput !== null
    ) {
      setPendingInput(null);
    }
    isUpdatingUrlRef.current = false;
  }, [urlSearchValue, pendingInput]);

  // Update the query parameters
  const updateSearchQuery = (newQuery: string) => {
    isUpdatingUrlRef.current = true; // Mark that we're updating the URL
    const params = new URLSearchParams(searchParams);
    if (newQuery) {
      params.set("q", newQuery);
    } else {
      params.delete("q");
    }

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      router.refresh(); // Re-fetch server-side data
    });
  };

  // Handle input change with debounce
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setPendingInput(newQuery); // Store in pending state for immediate UI update

    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      updateSearchQuery(newQuery);
      // Clear pending after URL is updated (URL change will sync via Effect)
    }, 1000); // Debounce input
  };

  // Clear search
  const clearSearch = () => {
    setPendingInput(null); // Clear pending input immediately
    updateSearchQuery(""); // Update URL immediately (no debounce for clear)
  };

  // Toggle mobile search input
  const toggleSearch = () => setShowInput((prev) => !prev);

  // Close search on outside click (mobile only)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node) &&
        mobile.isMobile
      ) {
        setShowInput(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobile.isMobile]);

  return (
    <div
      className="relative flex items-center w-full max-w-md gap-2 pt-4"
      ref={searchRef}
    >
      {/* Search Icon (Only visible on mobile) */}
      <button
        className="p-2 rounded-full bg-secondary hover:bg-kanaliiga-orange/40 transition-all cursor-pointer border border-ring"
        onClick={toggleSearch}
        aria-label="Toggle Search"
      >
        <Search className="h-5 w-5 text-primary" />
      </button>

      {/* Input Field with Clear Button */}
      <div
        className={cn(
          `relative transition-all duration-300 overflow-hidden md:overflow-visible`,
          showInput ? "w-full opacity-100" : "w-0 opacity-0 pointer-events-none"
        )}
      >
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder={placeholder}
          className="pl-8"
          value={searchValue}
          onChange={handleChange}
          disabled={isPending}
        />

        {isPending && (
          <div className="absolute right-8 top-1/2 -translate-y-1/2">
            <SelectSpinner />
          </div>
        )}

        {/* Clear Button */}
        {searchValue && (
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 text-primary bg-secondary rounded-full p-1 hover:bg-secondary/80 transition-all"
            onClick={clearSearch}
            aria-label="Clear Search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
