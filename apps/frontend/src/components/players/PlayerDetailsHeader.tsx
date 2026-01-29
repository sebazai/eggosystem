"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

import { FaceITLevelIcon } from "../profile/FaceITLevelIcon";
import { CS2PremierRankBadge } from "../profile/CS2PremierRankBadge";
import { useCS2PremierRank } from "@/hooks/data/useCS2PremierRank";
import { useFaceITRank } from "@/hooks/data/useFaceITRank";
import { usePlayerTeamDetails } from "@/hooks/data/filtered/usePlayerTeamDetails";
import { ContentContainer } from "../layout/ContentContainer";
import { useFilters } from "@/context/FilterContext";
import { PlayerWinsLosses } from "./PlayerWinsLosses";
import { useSteamPlayer } from "@/hooks/data/useSteamPlayer";
import { createTeamLogoUrl, createAvatarUrl } from "@/lib/utils";
import { useFaceitPlayerData } from "@/hooks/data/useFaceitPlayerData";
import { FaceitLink } from "../ui/FaceitLink";

export const PlayerDetailsHeader = ({ steamId }: { steamId: string }) => {
  const { filterParams, getFilteredQueryString } = useFilters();
  const { playerTeamDetails, isLoading, isError } = usePlayerTeamDetails({
    steamId,
    ...filterParams
  });
  const { steamPlayer } = useSteamPlayer(steamId);
  const faceItRank = useFaceITRank(steamId, { skipExternalCheck: true });
  const cs2PremierRank = useCS2PremierRank(steamId, {
    skipExternalCheck: true
  });
  const faceitPlayerData = useFaceitPlayerData(steamId);

  if (isLoading) {
    return (
      <div className="bg-card rounded-md overflow-hidden">
        <div className="p-3 sm:p-6 border-b border-kanaliiga-orange border-b-2">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="w-20 h-20 bg-kanaliiga-light-brown/30 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-7 w-48 bg-kanaliiga-light-brown/30 rounded animate-pulse" />
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-kanaliiga-light-brown/30 animate-pulse" />
                <div className="w-5 h-5 rounded-full bg-kanaliiga-light-brown/30 animate-pulse" />
              </div>
              <div className="h-4 w-32 bg-kanaliiga-light-brown/30 rounded animate-pulse" />
            </div>
            <div className="ml-auto">
              <div className="h-16 w-24 bg-kanaliiga-light-brown/30 rounded animate-pulse" />
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
  const avatarUrl = steamPlayer?.avatar
    ? createAvatarUrl(steamPlayer.avatar)
    : null;

  return (
    <div className="bg-card rounded-md overflow-hidden">
      <div className="p-3 sm:p-6 border-b border-kanaliiga-orange border-b-2">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="w-20 h-20 bg-kanaliiga-light-brown/30 rounded-full flex items-center justify-center text-3xl font-bold overflow-hidden">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={steamPlayer?.nickname ?? "Player avatar"}
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            ) : (
              (steamPlayer?.nickname.charAt(0).toUpperCase() ?? "U")
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-kanaliiga-orange">
              <div className="flex gap-2">
                {steamPlayer?.nickname ?? "Unknown player"}{" "}
                {faceitPlayerData.faceitPlayerData?.faceit_url ? (
                  <FaceitLink
                    href={faceitPlayerData.faceitPlayerData.faceit_url}
                    iconSize="sm"
                  />
                ) : null}
              </div>
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {/* Add rank indicators here */}
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
      </div>
    </div>
  );
};
