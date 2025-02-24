"use client";

import FlipCard from "@/components/organization-card";
import FadeOnScroll from "@/components/layout/fade-on-scroll";
import { useOrganizations } from "@/hooks/data/useOrganizations";

export default function AllOrganizations() {
  const { organizations, isError, isLoading } = useOrganizations();
  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading organizations</div>;
  if (!organizations) return <div>No organizations found</div>;
  return (
    <div>
      <h1 id="heading-1" className="sticky top-[var(--nav-height)] z-50">
        Organizations
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-6 justify-items-center">
        {organizations.map((org) => {
          return (
            <FadeOnScroll key={org.id}>
              <FlipCard
                companyName={org.name}
                backTitle="Jepulis"
                backDesc="Nebulis"
                href={`/organizations/${org.id}`}
                imageSrc={`https://stats.kanaliiga.fi/img/${org.logo}`}
              />
            </FadeOnScroll>
          );
        })}
      </div>
    </div>
  );
}
