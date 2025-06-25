"use client";

import { useFilters } from "@/context/FilterContext";
import { MultiFilters } from "../filters/MultiFilters";
import { TeamsTable } from "./TeamsTable";
import { ContentContainer } from "../layout/ContentContainer";
import { TeamMapStatsTab } from "./TeamMapStatsTab";
import * as Tabs from "@radix-ui/react-tabs";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export const TeamPageWithFilters = ({ teamId }: { teamId: number }) => {
  const { filterParams, isLoading, error, isValidating } = useFilters();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get tab from URL or default to "main"
  const activeTab = searchParams.get("tab") || "main";

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Set tab on initial load if not in URL
  useEffect(() => {
    if (!searchParams.get("tab")) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", "main");
      router.push(`?${params.toString()}`, { scroll: false });
    }
  }, [router, searchParams]);

  if (isLoading || !filterParams || isValidating)
    return <ContentContainer>Loading...</ContentContainer>;
  if (error) return <ContentContainer>Failed to load filters</ContentContainer>;
  return (
    <>
      <MultiFilters
        seasons={filterParams.seasons}
        leagues={filterParams.leagues}
        stages={filterParams.stages}
        teams={[teamId]}
        maps={filterParams.maps}
        hideFilters={{ teams: true }}
      />
      <Tabs.Root
        className="w-full"
        value={activeTab}
        onValueChange={handleTabChange}
      >
        <Tabs.List className="flex border-b border-kanaliiga-light-brown/40 mb-6 gap-1">
          <Tabs.Trigger
            value="main"
            className="py-3 px-5 bg-transparent text-base font-semibold hover:bg-kanaliiga-light-brown/10 data-[state=active]:bg-kanaliiga-light-brown/20 data-[state=active]:border-b-2 data-[state=active]:border-kanaliiga-orange focus:outline-none cursor-pointer"
          >
            Main
          </Tabs.Trigger>
          <Tabs.Trigger
            value="mapstats"
            className="py-3 px-5 bg-transparent text-base font-semibold hover:bg-kanaliiga-light-brown/10 data-[state=active]:bg-kanaliiga-light-brown/20 data-[state=active]:border-b-2 data-[state=active]:border-kanaliiga-orange focus:outline-none cursor-pointer"
          >
            Map Statistics
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="main" className="focus:outline-none">
          <TeamsTable teamId={teamId} filterQueryParams={filterParams} />
        </Tabs.Content>
        <Tabs.Content value="mapstats" className="focus:outline-none">
          <TeamMapStatsTab teamId={teamId} filterQueryParams={filterParams} />
        </Tabs.Content>
      </Tabs.Root>
    </>
  );
};
