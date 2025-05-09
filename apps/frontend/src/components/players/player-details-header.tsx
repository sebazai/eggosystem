"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

import { FaceITLevelIcon } from "../profile/faceit-level";
import { CS2PremierRankBadge } from "../profile/cs2-premier-rank";
import { useCS2PremierRank } from "@/hooks/data/useCS2PremierRank";
import { useFaceITRank } from "@/hooks/data/useFaceITRank";
import { usePlayerTeamDetails } from "@/hooks/data/filtered/usePlayerTeamDetails";
import { ContentContainer } from "../layout/content-container";
import { useFilters } from "@/context/FilterContext";
import { PlayerWinsLosses } from "./player-game-wins-losses";
import { useSteamPlayer } from "@/hooks/data/useSteamPlayer";

export const PlayerDetailsHeader = ({ steamId }: { steamId: string }) => {
  const { filterParams } = useFilters();
  const { playerTeamDetails, isLoading, isError } = usePlayerTeamDetails({
    steamId,
    ...filterParams
  });
  const { steamPlayer } = useSteamPlayer(steamId);
  const faceItRank = useFaceITRank(steamId);
  const cs2PremierRank = useCS2PremierRank(steamId);

  if (isLoading) {
    return (
      <div className="bg-card rounded-md overflow-hidden mb-3">
        <div className="p-6 border-b border-border animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-kanaliiga-light-brown/20 rounded-full" />
            <div className="space-y-2">
              <div className="h-6 w-40 bg-kanaliiga-light-brown/20 rounded" />
              <div className="h-4 w-20 bg-kanaliiga-light-brown/20 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <ContentContainer>
        <div className="text-red-500 text-center">
          Error loading player details.
        </div>
      </ContentContainer>
    );
  }

  const playerTeam = playerTeamDetails?.[0] ?? null;

  return (
    <div className="bg-card rounded-md overflow-hidden mb-3">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-kanaliiga-light-brown/20 rounded-full flex items-center justify-center text-3xl font-bold">
            {steamPlayer?.nickname.charAt(0).toUpperCase() ?? "U"}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-kanaliiga-orange">
              {steamPlayer?.nickname ?? "Unknown player"}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {/* Add rank indicators here */}
              <div className="flex items-center gap-2">
                {faceItRank.isLoading || cs2PremierRank.isLoading ? (
                  <div className="flex gap-1">
                    <div className="w-5 h-5 rounded-full bg-kanaliiga-light-brown/20 animate-pulse"></div>
                    <div className="w-5 h-5 rounded-full bg-kanaliiga-light-brown/20 animate-pulse"></div>
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
                  href={`/teams/${playerTeam?.team_id}`}
                  className="flex items-center gap-2 hover:text-kanaliiga-orange transition-colors"
                >
                  <Image
                    src={
                      playerTeam?.team_logo
                        ? `/teams/${playerTeam?.team_logo}`
                        : "/teams/nologo.png"
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
      </div>
    </div>
  );
};
