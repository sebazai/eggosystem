"use client";
import { Input } from "@/components/ui/input";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useClickOutside } from "@/hooks/useClickOutside";

interface SearchBarProps {
  placeholder: string;
  value: string;
  setValue: (value: string) => void;
}

export const SearchBar = ({ placeholder, value, setValue }: SearchBarProps) => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [showInput, setShowInput] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const hasMounted = useRef(false);

  const searchQuery = searchParams.get("search") || "";

  useEffect(() => {
    const isLandscapeMobile =
      window.innerWidth <= 768 && window.innerHeight < window.innerWidth;
    if (searchQuery.length > 0 && !isLandscapeMobile) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [searchQuery]);

  useEffect(() => {
    if (!hasMounted.current && searchQuery !== "") {
      setValue(searchQuery);
      hasMounted.current = true;
    }
  }, [searchQuery, setValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearch = e.target.value;
    const params = new URLSearchParams(searchParams);

    if (newSearch) {
      params.set("search", newSearch);
    } else {
      params.delete("search");
    }

    setValue(newSearch);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const clearSearch = () => {
    setValue("");
    const params = new URLSearchParams(searchParams);
    params.delete("search");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const toggleSearch = () => setShowInput((prev) => !prev);

  // Close search only on mobile
  useClickOutside(searchRef, () => {
    if (window.innerWidth < 768) {
      setShowInput(false);
    }
  });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setShowInput(true);
      } else {
        setShowInput(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      className="relative w-full max-w-md my-4 flex items-center gap-2"
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
        className={cn(
          "relative transition-all duration-300 overflow-hidden md:overflow-visible",
          showInput
            ? "w-full opacity-100"
            : "w-0 opacity-0 pointer-events-none md:w-full md:opacity-100"
        )}
      >
        <Input
          type="text"
          placeholder={placeholder}
          className="bg-secondary/70 pr-10" // Add padding for the clear button
          value={value}
          onChange={handleChange}
        />
        {value && (
          <button
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-primary bg-secondary rounded-full p-1 hover:bg-secondary/80 transition-all"
            onClick={clearSearch}
            aria-label="Clear Search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};
