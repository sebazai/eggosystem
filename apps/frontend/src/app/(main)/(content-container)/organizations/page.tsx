import OrganizationFlipCard from "@/components/organizations/org-flip-card";
import FadeOnScroll from "@/components/layout/fade-on-scroll";
import { envConfig } from "@/configs/env";
import type { Organizations } from "@eggosystem/types";
import { SearchBar } from "@/components/inputs/search-bar";
import { Suspense } from "react";
import { Spinner } from "@/components/icons";
import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/metadata";

interface OrganizationProps {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({
  searchParams
}: OrganizationProps): Promise<Metadata> {
  const { q } = await searchParams;

  if (q) {
    return createPageMetadata({
      title: `Search results for "${q}" in Organizations`
    });
  }
  return createPageMetadata({
    title: "Organizations"
  });
}

export default async function AllOrganizations(props: {
  searchParams: Promise<{ q?: string }>;
}) {
  const searchParams = await props.searchParams;
  const search = searchParams.q;
  const url = search
    ? `${envConfig.API_URL}/api/v1/organizations?q=${search}`
    : `${envConfig.API_URL}/api/v1/organizations`;
  const orgs = await fetch(url);
  const organizations: Organizations[] = await orgs.json();

  return (
    <div>
      <h1 className="text-3xl mb-4 md:mb-8">
        {search
          ? `Search results for "${search}" in Organizations`
          : "Organizations"}
      </h1>
      <div
        id="sticky-header"
        className="sticky z-30 top-[var(--nav-height)] transition-[top] duration-300 ease-in-out sm:landscape:none xs:landscape:top-6 md:landscape:top-[var(--nav-height)]"
      >
        <Suspense fallback={<Spinner />}>
          <SearchBar placeholder={"Search organizations..."} />
        </Suspense>
      </div>
      <div>
        {/* Organization Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6 justify-items-center">
          {organizations.map((org) => (
            <FadeOnScroll key={org.id}>
              <OrganizationFlipCard
                organization={org}
                isSupportingOrg={!!org.sort_order}
              />
            </FadeOnScroll>
          ))}
        </div>
      </div>
    </div>
  );
}
