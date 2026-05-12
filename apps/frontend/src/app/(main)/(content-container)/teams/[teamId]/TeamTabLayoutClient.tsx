"use client";
import { MultiFilters } from "@/components/filters/MultiFilters";
import { PageSkeleton } from "@/components/loading";
import { TeamsHeader } from "@/components/teams/TeamsHeader";
import { TeamTrophies } from "@/components/teams/TeamTrophies";
import { useFilters } from "@/context/FilterContext";
import { FilterProvider } from "@/context/FilterContext";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export default function TeamTabLayoutClient({
  children,
  teamId
}: {
  children: React.ReactNode;
  teamId: string;
}) {
  return (
    <FilterProvider appId="730">
      <TeamTabLayoutContent teamId={teamId}>{children}</TeamTabLayoutContent>
    </FilterProvider>
  );
}

function TeamTabLayoutContent({
  children,
  teamId
}: {
  children: React.ReactNode;
  teamId: string;
}) {
  const { filterParams, isLoading, error, isValidating } = useFilters();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (isLoading || !filterParams || isValidating) {
    return <PageSkeleton showFilters={true} />;
  }

  if (error) {
    return <div>Failed to load filters</div>;
  }

  const tabs = [
    {
      value: "main",
      label: "Main",
      pathname: `/teams/${teamId}`
    },
    {
      value: "mapstats",
      label: "Map Statistics",
      pathname: `/teams/${teamId}/mapstats`
    }
  ];

  const isActiveTab = (tabPathname: string) => {
    if (tabPathname === `/teams/${teamId}`) {
      return pathname === tabPathname;
    }
    return pathname.startsWith(tabPathname);
  };

  return (
    <>
      <MultiFilters
        seasons={filterParams.seasons}
        leagues={filterParams.leagues}
        stages={filterParams.stages}
        teams={[Number(teamId)]}
        maps={filterParams.maps}
        hideFilters={{ teams: true }}
      />

      <TeamsHeader />
      <TeamTrophies teamId={Number(teamId)} />

      {/* Sticky Tabs */}
      <div className="sticky top-0 z-10 bg-card rounded-b-md shadow-sm">
        <div className="flex border-b border-kanaliiga-light-brown/40 gap-1">
          {tabs.map((tab) => (
            <Link
              key={tab.value}
              href={`${tab.pathname}?${searchParams.toString()}`}
              className={`py-3 px-5 bg-transparent text-base font-semibold hover:bg-kanaliiga-light-brown/10 focus:outline-none cursor-pointer ${
                isActiveTab(tab.pathname)
                  ? "bg-kanaliiga-light-brown/20 border-b-2 border-kanaliiga-orange"
                  : ""
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        <div className="mt-6 px-2 md:px-4">{children}</div>
      </div>
    </>
  );
}
