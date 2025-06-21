"use client";

import { useFilters } from "@/context/FilterContext";
import { MultiFilters } from "../filters/MultiFilters";
import { TeamsTable } from "./TeamsTable";
import { ContentContainer } from "../layout/ContentContainer";
import { TeamMapStatsTab } from "./TeamMapStatsTab";
import * as Tabs from "@radix-ui/react-tabs";

export const TeamPageWithFilters = ({ teamId }: { teamId: number }) => {
  const { filterParams, isLoading, error, isValidating } = useFilters();

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
      <Tabs.Root className="w-full" defaultValue="main">
        <Tabs.List className="flex border-b mb-4">
          <Tabs.Trigger
            value="main"
            className="py-2 px-4 bg-transparent hover:bg-kanaliiga-light-brown/10 data-[state=active]:bg-kanaliiga-light-brown/20 data-[state=active]:border-b-2 data-[state=active]:border-kanaliiga-orange focus:outline-none"
          >
            Main
          </Tabs.Trigger>
          <Tabs.Trigger
            value="mapstats"
            className="py-2 px-4 bg-transparent hover:bg-kanaliiga-light-brown/10 data-[state=active]:bg-kanaliiga-light-brown/20 data-[state=active]:border-b-2 data-[state=active]:border-kanaliiga-orange focus:outline-none"
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
