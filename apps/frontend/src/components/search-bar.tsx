"use client";
import { Input } from "@/components/ui/input";
import { useEffect } from "react";

interface SearchBarProps {
  placeholder: string;
  value: string;
  setValue: (value: string) => void;
}

export const SearchBar = ({ placeholder, value, setValue }: SearchBarProps) => {
  // Scroll to top whenever searchQuery changes
  useEffect(() => {
    if (value.length > 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [value]);

  return (
    <div className="w-full max-w-md my-4">
      <Input
        type="text"
        placeholder={placeholder}
        className="bg-secondary/70"
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setValue(e.target.value)
        }
      />
    </div>
  );
};
