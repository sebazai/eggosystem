"use client";
import { MultiFilters } from "@/components/filters/MultiFilters";
import { TeamsHeader } from "@/components/teams/TeamsHeader";
import { useFilters } from "@/context/FilterContext";
import { FilterProvider } from "@/context/FilterContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { filterParamsToSearchParams } from "@/lib/utils";

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

  if (isLoading || !filterParams || isValidating) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Failed to load filters</div>;
  }

  const tabs = [
    {
      value: "main",
      label: "Main",
      href: {
        pathname: `/teams/${teamId}`,
        query: filterParamsToSearchParams(filterParams).toString()
      }
    },
    {
      value: "mapstats",
      label: "Map Statistics",
      href: {
        pathname: `/teams/${teamId}/mapstats`,
        query: filterParamsToSearchParams(filterParams).toString()
      }
    }
  ];

  const isActiveTab = (href: { pathname: string; query: string }) => {
    if (href.pathname === `/teams/${teamId}`) {
      return pathname === href.pathname;
    }
    return pathname.startsWith(href.pathname);
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

      {/* Sticky Tabs */}
      <div className="sticky top-0 z-10 bg-card rounded-b-md shadow-sm">
        <div className="flex border-b border-kanaliiga-light-brown/40 gap-1">
          {tabs.map((tab) => (
            <Link
              key={tab.value}
              href={tab.href}
              className={`py-3 px-5 bg-transparent text-base font-semibold hover:bg-kanaliiga-light-brown/10 focus:outline-none cursor-pointer ${
                isActiveTab(tab.href)
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
