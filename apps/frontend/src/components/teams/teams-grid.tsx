"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { type TeamStats } from "@/hooks/data/useTeams";
import { createStatsKanaliigaImageUrl } from "@/lib/utils";

interface TeamsGridProps {
  teams: TeamStats[];
  isLoading: boolean;
}

export const TeamsGrid: React.FC<TeamsGridProps> = ({ teams, isLoading }) => {
  // Debug the component props
  console.log("TeamsGrid rendering:", {
    teamsLength: teams?.length,
    isLoading
  });

  if (isLoading) {
    console.log("TeamsGrid showing skeletons due to loading state");
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <TeamCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (!teams || teams.length === 0) {
    console.log("TeamsGrid showing no teams found message");
    return (
      <div className="bg-card rounded-md p-8 text-center">
        <p className="text-muted-foreground">
          No teams found with the current filters
        </p>
      </div>
    );
  }

  console.log("TeamsGrid rendering actual team cards:", teams.length);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {teams.map((team) => (
        <TeamCard key={team.id} team={team} />
      ))}
    </div>
  );
};

const TeamCard: React.FC<{ team: TeamStats }> = ({ team }) => {
  const [imageError, setImageError] = useState(false);
  const defaultLogoPath = "/teams/nologo.svg";

  // Use createStatsKanaliigaImageUrl function for team logos
  let logoUrl = defaultLogoPath;

  if (!imageError && team.team_logo && team.team_logo.trim() !== "") {
    try {
      logoUrl = createStatsKanaliigaImageUrl(team.team_logo);
    } catch (error) {
      console.error("Error creating team logo URL:", error);
    }
  }

  // Ensure win percentage is not greater than 100%
  const winPercentage = Math.min(team.win_percentage, 100);

  return (
    <Link
      href={`/teams/${team.id}`}
      className="block bg-card rounded-md overflow-hidden hover:bg-kanaliiga-light-brown/10 transition-colors"
    >
      <div className="bg-kanaliiga-light-brown/20 p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Image
            src={logoUrl}
            alt={`${team.name} logo`}
            width={60}
            height={60}
            className="bg-card object-contain"
            onError={() => setImageError(true)}
          />
          <div>
            <h3 className="text-lg font-bold">{team.name}</h3>
            <p className="text-sm text-muted-foreground">{team.league_name}</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-3 gap-4">
          <StatBox label="Matches" value={team.matches_played.toString()} />
          <StatBox
            label="Record"
            value={`${team.wins}/${team.losses}/${team.ties}`}
          />
          <StatBox
            label="Win %"
            value={`${winPercentage.toFixed(1)}%`}
            highlight={winPercentage > 50}
          />
        </div>
      </div>
    </Link>
  );
};

const StatBox: React.FC<{
  label: string;
  value: string;
  highlight?: boolean;
}> = ({ label, value, highlight = false }) => {
  return (
    <div className="text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`text-lg font-semibold ${highlight ? "text-kanaliiga-orange" : ""}`}
      >
        {value}
      </p>
    </div>
  );
};

const TeamCardSkeleton: React.FC = () => {
  return (
    <div className="bg-card rounded-md overflow-hidden">
      <div className="bg-kanaliiga-light-brown/20 p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-[60px] h-[60px] bg-gray-800 animate-pulse" />
          <div className="space-y-2">
            <div className="h-5 w-32 bg-gray-800 rounded animate-pulse" />
            <div className="h-4 w-24 bg-gray-800 rounded animate-pulse" />
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="text-center space-y-2">
              <div className="h-3 w-12 mx-auto bg-gray-800 rounded animate-pulse" />
              <div className="h-5 w-8 mx-auto bg-gray-800 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
