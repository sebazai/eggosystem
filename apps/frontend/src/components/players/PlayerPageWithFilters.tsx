"use client";

import { useFilters } from "@/context/FilterContext";
import { MultiFilters } from "../filters/MultiFilters";
import { ContentContainer } from "../layout/ContentContainer";
import { PlayerDetails } from "./PlayerDetails";
import { PlayerMapStatsTab } from "./PlayerMapStatsTab";
import { PlayerSkillTab } from "./PlayerSkillTab";
import * as Tabs from "@radix-ui/react-tabs";

export const PlayerPageWithFilters = ({ steamId }: { steamId: string }) => {
  const { filterParams, isLoading, error, isValidating } = useFilters();

  if (isLoading || !filterParams || isValidating)
    return <ContentContainer>Loading...</ContentContainer>;
  if (error) return <ContentContainer>Failed to load filters</ContentContainer>;
  return (
    <>
      <MultiFilters {...filterParams} steamId={steamId} />
      <Tabs.Root className="w-full" defaultValue="main">
        <Tabs.List className="flex border-b mb-4">
          <Tabs.Trigger
            value="main"
            className="py-2 px-4 bg-transparent hover:bg-kanaliiga-light-brown/10 data-[state=active]:bg-kanaliiga-light-brown/20 data-[state=active]:border-b-2 data-[state=active]:border-kanaliiga-orange focus:outline-none"
          >
            Main
          </Tabs.Trigger>
          <Tabs.Trigger
            value="skills"
            className="py-2 px-4 bg-transparent hover:bg-kanaliiga-light-brown/10 data-[state=active]:bg-kanaliiga-light-brown/20 data-[state=active]:border-b-2 data-[state=active]:border-kanaliiga-orange focus:outline-none"
          >
            Skills
          </Tabs.Trigger>
          <Tabs.Trigger
            value="mapstats"
            className="py-2 px-4 bg-transparent hover:bg-kanaliiga-light-brown/10 data-[state=active]:bg-kanaliiga-light-brown/20 data-[state=active]:border-b-2 data-[state=active]:border-kanaliiga-orange focus:outline-none"
          >
            Map Statistics
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="main" className="focus:outline-none">
          <PlayerDetails steamId={steamId} />
        </Tabs.Content>
        <Tabs.Content value="skills" className="focus:outline-none">
          <PlayerSkillTab steamId={steamId} filterQueryParams={filterParams} />
        </Tabs.Content>
        <Tabs.Content value="mapstats" className="focus:outline-none">
          <PlayerMapStatsTab
            steamId={steamId}
            filterQueryParams={filterParams}
          />
        </Tabs.Content>
      </Tabs.Root>
    </>
  );
};
