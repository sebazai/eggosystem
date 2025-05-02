"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

import { FaceITLevelIcon } from "../profile/faceit-level";
import { CS2PremierRankBadge } from "../profile/cs2-premier-rank";
import { useCS2PremierRank } from "@/hooks/data/useCS2PremierRank";
import { useFaceITRank } from "@/hooks/data/useFaceITRank";
import type { FilterParamsQuery } from "@/lib/utils";
import { usePlayerGameDetails } from "@/hooks/data/usePlayerGameDetails";
import { ContentContainer } from "../layout/content-container";

export const PlayerDetailsHeader = ({
  steamId,
  filterParams
}: {
  steamId: string;
  filterParams: FilterParamsQuery;
}) => {
  const { playerGameDetails, isLoading, isError } = usePlayerGameDetails({
    steamId,
    ...filterParams
  });
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

  // Gracefully "fail"
  if (!playerGameDetails) {
    console.error("No player game details");
    return <></>;
  }

  const playerDetails = playerGameDetails[0];

  // Gracefully "fail"
  if (!playerDetails) {
    console.error("No player game details");
    return <></>;
  }

  const total = playerGameDetails.reduce(
    (acc, player) => {
      acc.wins += player.wins;
      acc.losses += player.losses;
      acc.draws += player.draws;
      acc.matches_played += player.matches_played;
      return acc;
    },
    { wins: 0, losses: 0, draws: 0, matches_played: 0 }
  );

  // get .wins of all playerDetails in reduce sum them up
  const winPercentage = (total.wins / Math.max(total.matches_played, 1)) * 100;

  return (
    <div className="bg-card rounded-md overflow-hidden mb-3">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-kanaliiga-light-brown/20 rounded-full flex items-center justify-center text-3xl font-bold">
            {playerDetails.nickname.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-kanaliiga-orange">
              {playerDetails.nickname}
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
                    {cs2PremierRank.cs2Rank?.rank ? (
                      <CS2PremierRankBadge
                        rankScore={cs2PremierRank.cs2Rank.rank}
                      />
                    ) : null}
                  </>
                )}
              </div>
            </div>
            {/* Team info on a new row */}
            <div className="flex items-center gap-2 mt-1">
              {playerGameDetails.length === 1 ? (
                <Link
                  href={`/teams/${playerDetails.team_id}`}
                  className="flex items-center gap-2 hover:text-kanaliiga-orange transition-colors"
                >
                  <Image
                    src={playerDetails.team_logo || "/teams/nologo.svg"}
                    alt={playerDetails.team_name || "No team"}
                    width={20}
                    height={20}
                    className="rounded-full"
                  />
                  <span className="text-muted-foreground">
                    {playerDetails.team_name}
                  </span>
                </Link>
              ) : (
                <span>In {playerGameDetails.length} teams</span>
              )}
            </div>
          </div>
          <div className="ml-auto">
            <div className="flex items-center gap-3">
              <div className="text-center">
                <div className="text-muted-foreground text-sm">W</div>
                <div className="text-lg font-semibold text-green-500">
                  {total.wins}
                </div>
              </div>
              <div className="text-center">
                <div className="text-muted-foreground text-sm">L</div>
                <div className="text-lg font-semibold text-red-500">
                  {total.losses}
                </div>
              </div>
              {total.draws !== 0 && (
                <div className="text-center">
                  <div className="text-muted-foreground text-sm">Draw</div>
                  <div className="text-lg font-semibold text-blue-500">
                    {total.draws}
                  </div>
                </div>
              )}
              <div className="text-center">
                <div className="text-muted-foreground text-sm">Win%</div>
                <div className="text-lg font-semibold">
                  {winPercentage.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
