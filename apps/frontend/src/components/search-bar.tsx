"use client";

import { Input } from "@/components/ui/input";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { Spinner } from "@/components/icons";

export function SearchBar({ placeholder }: { placeholder: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(searchParams.get("q") || "");
  const [isPending, startTransition] = useTransition();
  const [showInput, setShowInput] = useState(false);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isPending && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isPending]);

  // Sync state when search params change
  useEffect(() => {
    setSearchValue(searchParams.get("q") || "");
  }, [searchParams]);

  // Update the query parameters
  const updateSearchQuery = (newQuery: string) => {
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
    setSearchValue(newQuery);

    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      updateSearchQuery(newQuery);
    }, 500); // Debounce input
  };

  // Clear search
  const clearSearch = () => {
    setSearchValue("");
    updateSearchQuery("");
  };

  // Toggle mobile search input
  const toggleSearch = () => setShowInput((prev) => !prev);

  // Close search on outside click (mobile only)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node) &&
        window.innerWidth < 768
      ) {
        setShowInput(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle screen resize
  useEffect(() => {
    const handleResize = () => {
      setShowInput(window.innerWidth >= 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      className="relative flex items-center w-full max-w-md gap-2"
      ref={searchRef}
    >
      {/* Search Icon (Only visible on mobile) */}
      <button
        className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-all md:hidden border border-ring"
        onClick={toggleSearch}
        aria-label="Toggle Search"
      >
        <Search className="h-5 w-5 text-primary" />
      </button>

      {/* Input Field with Clear Button */}
      <div
        className={`relative transition-all duration-300 overflow-hidden md:overflow-visible ${
          showInput
            ? "w-full opacity-100"
            : "w-0 opacity-0 pointer-events-none md:w-full md:opacity-100"
        }`}
      >
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          className="pl-8 pr-10 bg-secondary/70"
          value={searchValue}
          onChange={handleChange}
          disabled={isPending}
        />

        {isPending && (
          <div className="absolute right-8 top-1/2 -translate-y-1/2">
            <Spinner />
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
