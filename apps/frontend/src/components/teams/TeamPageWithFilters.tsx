"use client";

import { useFilters } from "@/context/FilterContext";
import { MultiFilters } from "../filters/MultiFilters";
import { TeamsTable } from "./TeamsTable";
import { ContentContainer } from "../layout/ContentContainer";
import { TeamMapStatsTab } from "./TeamMapStatsTab";
import * as Tabs from "@radix-ui/react-tabs";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useFilteredTeamById } from "@/hooks/data/filtered/useFilteredTeamById";
import { NextImageFallback } from "../layout/NextImageFallback";
import { createTeamLogoUrl } from "@/lib/utils";
import { TeamWinLossDetails } from "./TeamWinLossDetails";

export const TeamPageWithFilters = ({ teamId }: { teamId: number }) => {
  const { filterParams, isLoading, error, isValidating } = useFilters();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get tab from URL or default to "main"
  const activeTab = searchParams.get("tab") || "main";

  // Get team data
  const { team, isLoading: isTeamLoading } = useFilteredTeamById({
    teamId,
    filterQueryParams: filterParams || {}
  });

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

      {/* Team Header - Always visible */}
      <div className="bg-card rounded-t-md overflow-hidden">
        <div className="p-3 sm:p-6 border-b border-border">
          {isTeamLoading ? (
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="rounded-full h-[80px] w-[80px] bg-gray-800 animate-pulse" />
              <div>
                <div className="h-8 w-40 bg-gray-800 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-60 bg-gray-800 rounded animate-pulse"></div>
              </div>
            </div>
          ) : team ? (
            <div className="flex items-center gap-2 sm:gap-4">
              <NextImageFallback
                src={createTeamLogoUrl(team.team_logo)}
                alt={team.name}
                width={80}
                height={80}
                className="rounded-full h-15 w-15 sm:h-25 sm:w-25"
              />
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-kanaliiga-orange">
                  {team.name}
                </h1>
                <div className="flex sm:flex-row flex-col sm:items-center gap-1 sm:gap-2 mt-1">
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    {team.latest_season_name}
                  </span>
                  <span className="hidden sm:block text-muted-foreground">
                    •
                  </span>
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    {team.latest_league_name}
                  </span>
                </div>
              </div>
              <div className="ml-auto">
                <TeamWinLossDetails
                  teamId={teamId}
                  filterQueryParams={filterParams}
                />
              </div>
            </div>
          ) : (
            <div>Team not found</div>
          )}
        </div>
      </div>

      {/* Sticky Tabs */}
      <div className="sticky top-0 z-10 bg-card rounded-b-md shadow-sm">
        <Tabs.Root
          className="w-full"
          value={activeTab}
          onValueChange={handleTabChange}
        >
          <Tabs.List className="flex border-b border-kanaliiga-light-brown/40 gap-1">
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

          <div className="mt-6">
            <Tabs.Content value="main" className="focus:outline-none">
              <TeamsTable
                teamId={teamId}
                filterQueryParams={filterParams}
                hideHeader={true}
              />
            </Tabs.Content>
            <Tabs.Content value="mapstats" className="focus:outline-none">
              <TeamMapStatsTab
                teamId={teamId}
                filterQueryParams={filterParams}
              />
            </Tabs.Content>
          </div>
        </Tabs.Root>
      </div>
    </>
  );
};
