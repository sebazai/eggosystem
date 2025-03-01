"use client";

import { SearchBar } from "@/components/search-bar";
import { Suspense } from "react";

export default function OrganizationContainer({
  searchQuery,
  setSearchQuery,
  children
}: {
  searchQuery: string;
  setSearchQuery: (newValue: string) => void;
  children: React.ReactNode;
}) {
  return (
    <Suspense>
      <title>Organizations - Kanahub</title>
      <h1>Organizations</h1>
      <div
        id="sticky-header"
        className="sticky z-30 top-[var(--nav-height)] sm:landscape:top-auto sm:landscape:relative transition-[top] duration-300 ease-in-out"
      >
        <SearchBar
          placeholder="Search organizations..."
          value={searchQuery}
          setValue={(newValue) => setSearchQuery(newValue)}
        />
      </div>
      <div>{children}</div>
    </Suspense>
  );
}
