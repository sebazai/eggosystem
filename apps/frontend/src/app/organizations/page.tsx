"use client";

import { useEffect, useState } from "react";
import FlipCard from "@/components/organization-card";
import FadeOnScroll from "@/components/layout/fade-on-scroll";
import { useOrganizations } from "@/hooks/data/useOrganizations";
import { Input } from "@/components/ui/input"; // Importing shadcn Input component

export default function AllOrganizations() {
  const { organizations, isError, isLoading } = useOrganizations();
  const [searchQuery, setSearchQuery] = useState("");

  // Scroll to top whenever searchQuery changes
  useEffect(() => {
    if (searchQuery.length > 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [searchQuery]);

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading organizations</div>;
  if (!organizations) return <div>No organizations found</div>;

  // Filter organizations based on search query
  const filteredOrganizations = organizations.filter((org) =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="px-6 py-4">
      <div
        id="sticky-header"
        className="sticky top-[var(--nav-height)] z-50 text-2xl font-bold backdrop-blur-xs"
      >
        <h1>Organizations</h1>

        {/* Search Input */}
        <div className="w-full max-w-md my-4">
          <Input
            type="text"
            placeholder="Search organizations..."
            className="border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchQuery(e.target.value)
            }
          />
        </div>
      </div>

      {/* Organization Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 justify-items-center">
        {filteredOrganizations.length > 0 ? (
          filteredOrganizations.map((org) => (
            <FadeOnScroll key={org.id}>
              <FlipCard
                id={org.id}
                companyName={org.name}
                href={`/organizations/${org.id}`}
                imageSrc={`https://stats.kanaliiga.fi/img/${org.logo}`}
              />
            </FadeOnScroll>
          ))
        ) : (
          <div className="col-span-full text-center text-gray-500 dark:text-gray-400">
            No organizations found
          </div>
        )}
      </div>
    </div>
  );
}
