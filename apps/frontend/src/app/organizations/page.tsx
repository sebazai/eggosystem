"use client";

import { useState } from "react";
import OrganizationFlipCard from "@/components/organization-flip-card";
import FadeOnScroll from "@/components/layout/fade-on-scroll";
import { useOrganizations } from "@/hooks/data/useOrganizations";
import OrganizationContainer from "./organization-container";
import { TheContainer } from "@/components/layout/the-container";

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
        <TheContainer>Loading...</TheContainer>
      </OrganizationContainer>
    );
  }
  if (isError) {
    return (
      <OrganizationContainer
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      >
        <TheContainer>Error loading organizations</TheContainer>
      </OrganizationContainer>
    );
  }
  if (!organizations || organizations.length === 0) {
    return (
      <OrganizationContainer
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      >
        <TheContainer>No organizations found</TheContainer>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6 justify-items-center">
        {filteredOrganizations.map((org) => (
          <FadeOnScroll key={org.id}>
            <OrganizationFlipCard organization={org} />
          </FadeOnScroll>
        ))}
      </div>
    </OrganizationContainer>
  );
}
