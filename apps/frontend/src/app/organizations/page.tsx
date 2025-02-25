"use client";

import { useState } from "react";
import OrganizationFlipCard from "@/components/organization-flip-card";
import FadeOnScroll from "@/components/layout/fade-on-scroll";
import { useOrganizations } from "@/hooks/data/useOrganizations";
import OrganizationContainer from "./organization-container";

export default function AllOrganizations() {
  const { organizations, isError, isLoading, isValidating } =
    useOrganizations();
  const [searchQuery, setSearchQuery] = useState("");

  if (isLoading || isValidating) {
    return (
      <OrganizationContainer
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      >
        <div>Loading...</div>
      </OrganizationContainer>
    );
  }
  if (isError) {
    return (
      <OrganizationContainer
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      >
        <div>Error loading organizations</div>
      </OrganizationContainer>
    );
  }
  if (!organizations) {
    return (
      <OrganizationContainer
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      >
        <div>No organizations found</div>
      </OrganizationContainer>
    );
  }

  // Filter organizations based on search query
  const filteredOrganizations = organizations.filter((org) =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <OrganizationContainer
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
    >
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
    </OrganizationContainer>
  );
}
