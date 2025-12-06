"use client";

import React from "react";
import { useTeamTrophies } from "../../hooks/data/useTeamTrophies";
import { TrophyBadge } from "../trophies/TrophyBadge";
import type { TrophyAssignment } from "@eggosystem/types";

interface TeamTrophiesProps {
  teamId: number;
}

export const TeamTrophies = ({ teamId }: TeamTrophiesProps) => {
  const { data, isLoading } = useTeamTrophies(teamId);

  // Don't show section if loading or no trophies
  if (isLoading) {
    return null; // Silent loading - don't show loading state for trophies
  }

  if (!data || data.trophies.length === 0) {
    return null;
  }

  return (
    <div className="bg-card rounded-lg mb-4 p-4">
      <h2 className="text-base font-bold mb-3">Trophies</h2>
      <div className="flex gap-3 items-center flex-wrap">
        {data.trophies.map((trophy: TrophyAssignment) => (
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
