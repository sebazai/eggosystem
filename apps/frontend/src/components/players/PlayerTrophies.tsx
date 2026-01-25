import React from "react";
import { usePlayerTrophies } from "../../hooks/data/usePlayerTrophies";
import { usePlayerAwardTrophies } from "../../hooks/data/usePlayerAwardTrophies";
import { createNextUrl } from "@/lib/utils";
import Image from "next/image";
import { TrophyBadge } from "../trophies/TrophyBadge";
import type { TrophyAssignment } from "@eggosystem/types";
import { Skeleton } from "@/components/ui/skeleton";

interface PlayerTrophiesProps {
  steamId: string;
}

export const PlayerTrophies = ({ steamId }: PlayerTrophiesProps) => {
  const { data: kanaRankData, isLoading: kanaRankLoading } =
    usePlayerTrophies(steamId);
  const { data: awardData, isLoading: awardLoading } =
    usePlayerAwardTrophies(steamId);

  const isLoading = kanaRankLoading || awardLoading;

  // Show loading state
  if (isLoading) {
    return (
      <div className="bg-card rounded-lg mb-4">
        <h2 className="text-base font-bold mb-3">Trophies</h2>
        <div className="flex gap-3 items-center flex-wrap">
          <Skeleton className="w-12 h-12 rounded-full" />
          <Skeleton className="w-12 h-12 rounded-full" />
          <Skeleton className="w-12 h-12 rounded-full" />
        </div>
      </div>
    );
  }

  // Don't show section if no data at all
  if (!kanaRankData && (!awardData || awardData.trophies.length === 0)) {
    return null;
  }

  // Get rank image based on rank and subrank
  const getRankImage = (rank: string, subrank: number) => {
    if (rank === "TOP_COCK") {
      return createNextUrl("/images/ranks/topcock.png");
    }

    const rankLower = rank.toLowerCase();
    return createNextUrl(`/images/ranks/${rankLower}${subrank}.png`);
  };

  // Get rank alt text description
  const getRankDescription = (rank: string, subrank: number) => {
    if (rank === "TOP_COCK") {
      return "TOP COCK";
    }

    return `${rank} ${subrank}`;
  };

  return (
    <div className="bg-card rounded-lg mb-4">
      <h2 className="text-base font-bold mb-3">Trophies</h2>
      <div className="flex gap-3 items-center flex-wrap">
        {/* Kanarank trophy */}
        {kanaRankData && (
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-12 h-12 rounded-full overflow-hidden">
                <Image
                  src={getRankImage(kanaRankData.rank, kanaRankData.subrank)}
                  alt={getRankDescription(
                    kanaRankData.rank,
                    kanaRankData.subrank
                  )}
                  width={48}
                  height={48}
                  className="object-cover w-full h-full"
                  title={getRankDescription(
                    kanaRankData.rank,
                    kanaRankData.subrank
                  )}
                />
              </div>

              {/* Show position for top 50 players */}
              {kanaRankData.is_top50 && kanaRankData.position && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center text-xs font-bold text-black">
                  #{kanaRankData.position}
                </div>
              )}
            </div>
            <span className="text-xs mt-1">Kanarank</span>
          </div>
        )}

        {/* Award trophies */}
        {awardData?.trophies.map((trophy: TrophyAssignment) => (
          <TrophyBadge
            key={trophy.id}
            imagePhash={trophy.image_phash}
            displayText={trophy.display_text}
            seasonId={trophy.season_id}
            placement={trophy.placement}
            category={trophy.trophy_category}
          />
        ))}
      </div>
    </div>
  );
};
