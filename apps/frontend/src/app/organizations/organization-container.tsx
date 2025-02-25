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
      <div
        id="sticky-header"
        className="sticky top-[var(--nav-height)] z-30 text-2xl font-bold backdrop-blur-xs"
      >
        <h1>Organizations</h1>
        <SearchBar
          placeholder="Search organizations..."
          value={searchQuery}
          setValue={(newValue) => setSearchQuery(newValue)}
        />
      </div>
      <div className="py-6">{children}</div>
    </Suspense>
  );
}
