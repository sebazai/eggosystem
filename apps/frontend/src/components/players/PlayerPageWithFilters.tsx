"use client";

import { useFilters } from "@/context/FilterContext";
import { MultiFilters } from "../filters/MultiFilters";
import { ContentContainer } from "../layout/ContentContainer";
import { PlayerDetails } from "./PlayerDetails";
import { PlayerMapStatsTab } from "./PlayerMapStatsTab";
import { PlayerSkillTab } from "./PlayerSkillTab";
import * as Tabs from "@radix-ui/react-tabs";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSteamPlayer } from "@/hooks/data/useSteamPlayer";
import { useCS2PremierRank } from "@/hooks/data/useCS2PremierRank";
import { useFaceITRank } from "@/hooks/data/useFaceITRank";
import { FaceITLevelIcon } from "../profile/FaceITLevelIcon";
import { CS2PremierRankBadge } from "../profile/CS2PremierRankBadge";
import { usePlayerTeamDetails } from "@/hooks/data/filtered/usePlayerTeamDetails";
import { PlayerWinsLosses } from "./PlayerWinsLosses";
import { createTeamLogoUrl } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

export const PlayerPageWithFilters = ({ steamId }: { steamId: string }) => {
  const {
    filterParams,
    isLoading,
    error,
    isValidating,
    getFilteredQueryString
  } = useFilters();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get tab from URL or default to "main"
  const activeTab = searchParams.get("tab") || "main";

  // Get player data
  const { steamPlayer, isLoading: isPlayerLoading } = useSteamPlayer(steamId);
  const { playerTeamDetails } = usePlayerTeamDetails({
    steamId,
    ...filterParams
  });
  const faceItRank = useFaceITRank(steamId);
  const cs2PremierRank = useCS2PremierRank(steamId);

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

  // Extract player's primary team if available
  const playerTeam = playerTeamDetails?.[0] ?? null;

  return (
    <>
      <MultiFilters {...filterParams} steamId={steamId} />

      {/* Player Header - Always visible */}
      <div className="bg-card rounded-t-md overflow-hidden">
        <div className="p-3 sm:p-6 border-b border-kanaliiga-orange">
          {isPlayerLoading ? (
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-kanaliiga-light-brown/30 rounded-full animate-pulse" />
              <div className="space-y-2">
                <div className="h-6 w-40 bg-kanaliiga-light-brown/30 rounded animate-pulse" />
                <div className="h-4 w-20 bg-kanaliiga-light-brown/30 rounded animate-pulse" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="w-20 h-20 bg-kanaliiga-light-brown/30 rounded-full flex items-center justify-center text-3xl font-bold">
                {steamPlayer?.nickname.charAt(0).toUpperCase() ?? "U"}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-kanaliiga-orange">
                  {steamPlayer?.nickname ?? "Unknown player"}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  {/* Rank indicators */}
                  <div className="flex items-center gap-2">
                    {faceItRank.isLoading || cs2PremierRank.isLoading ? (
                      <div className="flex gap-1">
                        <div className="w-5 h-5 rounded-full bg-kanaliiga-light-brown/30 animate-pulse"></div>
                        <div className="w-5 h-5 rounded-full bg-kanaliiga-light-brown/30 animate-pulse"></div>
                      </div>
                    ) : (
                      <>
                        {faceItRank.faceItRank?.faceit_level ? (
                          <FaceITLevelIcon
                            level={faceItRank.faceItRank.faceit_level}
                          />
                        ) : null}
                        {cs2PremierRank.cs2Rank?.average_rank ? (
                          <CS2PremierRankBadge
                            rankScore={cs2PremierRank.cs2Rank.average_rank}
                          />
                        ) : null}
                      </>
                    )}
                  </div>
                </div>
                {/* Team info on a new row */}
                <div className="flex items-center gap-2 mt-1">
                  {playerTeamDetails?.length === 1 ? (
                    <Link
                      href={{
                        pathname: `/teams/${playerTeam?.team_id}`,
                        query: getFilteredQueryString(["teams"])
                      }}
                      className="flex items-center gap-2 hover:text-kanaliiga-orange transition-colors"
                    >
                      <Image
                        src={
                          playerTeam?.team_logo
                            ? createTeamLogoUrl(playerTeam.team_logo)
                            : "/team-images/nologo.png"
                        }
                        alt={playerTeam?.team_name || "No team"}
                        width={20}
                        height={20}
                        className="rounded-full"
                      />
                      <span className="text-muted-foreground">
                        {playerTeam?.team_name}
                      </span>
                    </Link>
                  ) : (
                    <span>In {playerTeamDetails?.length ?? 0} teams</span>
                  )}
                </div>
              </div>
              <div className="ml-auto">
                <PlayerWinsLosses steamId={steamId} />
              </div>
            </div>
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
              value="skills"
              className="py-3 px-5 bg-transparent text-base font-semibold hover:bg-kanaliiga-light-brown/10 data-[state=active]:bg-kanaliiga-light-brown/20 data-[state=active]:border-b-2 data-[state=active]:border-kanaliiga-orange focus:outline-none cursor-pointer"
            >
              Skills
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
              <PlayerDetails steamId={steamId} hideHeader={true} />
            </Tabs.Content>
            <Tabs.Content value="skills" className="focus:outline-none">
              <PlayerSkillTab
                steamId={steamId}
                filterQueryParams={filterParams}
              />
            </Tabs.Content>
            <Tabs.Content value="mapstats" className="focus:outline-none">
              <PlayerMapStatsTab
                steamId={steamId}
                filterQueryParams={filterParams}
              />
            </Tabs.Content>
          </div>
        </Tabs.Root>
      </div>
    </>
  );
};
