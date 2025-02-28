"use client";

import { SearchBar } from "@/components/search-bar";
import { Suspense, useEffect, useState } from "react";

export default function OrganizationContainer({
  searchQuery,
  setSearchQuery,
  children
}: {
  searchQuery: string;
  setSearchQuery: (newValue: string) => void;
  children: React.ReactNode;
}) {
  const [navHeight, setNavHeight] = useState<number | null>(null);

  useEffect(() => {
    const nav = document.getElementById("navigation");
    if (!nav) return;

    const updateNavHeight = () => {
      const newHeight = nav.offsetHeight;
      if (newHeight !== navHeight) {
        setNavHeight(newHeight); // Trigger re-render
      }
    };

    // Initial set
    updateNavHeight();

    // Observe changes
    const observer = new ResizeObserver(updateNavHeight);
    observer.observe(nav);

    return () => observer.disconnect();
  }, [navHeight]); // Dependency ensures re-render

  return (
    <Suspense>
      <title>Organizations - Kanahub</title>
      {navHeight !== null && ( // Ensure it renders only after we get height
        <div
          id="sticky-header"
          className="sticky z-30 backdrop-blur-xs transition-[top] duration-300 ease-in-out"
          style={{ top: `${navHeight}px` }}
        >
          <h1>Organizations</h1>
          <SearchBar
            placeholder="Search organizations..."
            value={searchQuery}
            setValue={(newValue) => setSearchQuery(newValue)}
          />
        </div>
      )}
      <div>{children}</div>
    </Suspense>
  );
}
