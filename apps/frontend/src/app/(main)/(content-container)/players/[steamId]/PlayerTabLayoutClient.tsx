"use client";
import { MultiFilters } from "@/components/filters/MultiFilters";
import { PlayerDetailsHeader } from "@/components/players/PlayerDetailsHeader";
import { useFilters } from "@/context/FilterContext";
import { FilterProvider } from "@/context/FilterContext";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export default function PlayerTabLayoutClient({
  children,
  steamId
}: {
  children: React.ReactNode;
  steamId: string;
}) {
  return (
    <FilterProvider appId="730">
      <PlayerTabLayoutContent steamId={steamId}>
        {children}
      </PlayerTabLayoutContent>
    </FilterProvider>
  );
}

function PlayerTabLayoutContent({
  children,
  steamId
}: {
  children: React.ReactNode;
  steamId: string;
}) {
  const { filterParams, isLoading, error, isValidating } = useFilters();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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
      pathname: `/players/${steamId}`
    },
    {
      value: "skills",
      label: "Skills",
      pathname: `/players/${steamId}/skills`
    },
    {
      value: "mapstats",
      label: "Map Statistics",
      pathname: `/players/${steamId}/mapstats`
    },
    {
      value: "historical",
      label: "Historical Data",
      pathname: `/players/${steamId}/historical`
    }
  ];

  const isActiveTab = (tabPathname: string) => {
    if (tabPathname === `/players/${steamId}`) {
      return pathname === tabPathname;
    }
    return pathname.startsWith(tabPathname);
  };

  return (
    <>
      <MultiFilters {...filterParams} steamId={steamId} />

      <PlayerDetailsHeader steamId={steamId} />

      {/* Sticky Tabs */}
      <div className="sticky top-0 z-10 bg-card rounded-b-md shadow-sm">
        <div className="grid grid-cols-2 sm:flex border-b border-kanaliiga-light-brown/40 gap-1">
          {tabs.map((tab) => (
            <Link
              key={tab.value}
              href={`${tab.pathname}?${searchParams.toString()}`}
              className={`py-3 px-2 sm:px-5 bg-transparent text-sm sm:text-base font-semibold hover:bg-kanaliiga-light-brown/10 focus:outline-none cursor-pointer text-center ${
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
