"use client";

import { useState } from "react";
import OrganizationFlipCard from "@/components/organization-flip-card";
import FadeOnScroll from "@/components/layout/fade-on-scroll";
import { useOrganizations } from "@/hooks/data/useOrganizations";
import { SearchBar } from "@/components/search-bar";

export default function AllOrganizations() {
  const { organizations, isError, isLoading } = useOrganizations();
  const [searchQuery, setSearchQuery] = useState("");

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading organizations</div>;
  if (!organizations) return <div>No organizations found</div>;

  // Filter organizations based on search query
  const filteredOrganizations = organizations.filter((org) =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div
        id="sticky-header"
        className="sticky top-[var(--nav-height)] z-50 text-2xl font-bold backdrop-blur-xs"
      >
        <h1>Organizations</h1>
        <SearchBar
          placeholder="Search organizations..."
          value={searchQuery}
          setValue={(newValue) => setSearchQuery(newValue)}
        />
      </div>

      {/* Organization Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 justify-items-center">
        {filteredOrganizations.length > 0 ? (
          filteredOrganizations.map((org) => (
            <FadeOnScroll key={org.id}>
              <OrganizationFlipCard
                id={org.id}
                companyName={org.name}
                href={`/organizations/${org.id}`}
                imageSrc={`https://stats.kanaliiga.fi/img/${org.logo}`}
              />
            </FadeOnScroll>
          ))
        ) : (
          <div className="col-span-full text-center">
            No organizations found
          </div>
        )}
      </div>
    </div>
  );
}
