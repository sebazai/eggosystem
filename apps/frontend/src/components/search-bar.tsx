"use client";
import { Input } from "@/components/ui/input";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

interface SearchBarProps {
  placeholder: string;
  value: string;
  setValue: (value: string) => void;
}

export const SearchBar = ({ placeholder, value, setValue }: SearchBarProps) => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const searchQuery = searchParams.get("search") || "";
  // Scroll to top whenever searchQuery changes
  useEffect(() => {
    if (searchQuery.length > 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [searchQuery]);

  useEffect(() => {
    if (searchQuery !== "") {
      setValue(searchQuery);
    }
  }, [searchQuery, setValue]);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearch = e.target.value;
    const params = new URLSearchParams(searchParams);

    if (newSearch) {
      params.set("search", newSearch);
    } else {
      params.delete("search"); // Remove query if empty
    }

    // Update URL without full page reload
    setValue(e.target.value);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="w-full max-w-md my-4">
      <Input
        type="text"
        placeholder={placeholder}
        className="bg-secondary/70"
        value={value}
        onChange={handleChange}
      />
    </div>
  );
};
