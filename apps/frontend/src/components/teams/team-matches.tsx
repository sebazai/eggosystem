"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { type TeamMatch } from "@/hooks/data/useTeamDetailsApi";
import { cn } from "@/lib/utils";

interface TeamMatchesProps {
  matches: TeamMatch[];
  isLoading: boolean;
}

export const TeamMatches: React.FC<TeamMatchesProps> = ({
  matches,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <MatchCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="bg-card rounded-md p-8 text-center">
        <p className="text-muted-foreground">
          No matches found with the current filters
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {matches.map((match) => (
        <MatchCard key={match.id} match={match} />
      ))}
    </div>
  );
};

const MatchCard: React.FC<{ match: TeamMatch }> = ({ match }) => {
  const resultClasses = {
    win: "text-green-500",
    loss: "text-red-500",
    tie: "text-yellow-500"
  };

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(match.date));

  const resultClass =
    match.result === "win"
      ? resultClasses.win
      : match.result === "loss"
        ? resultClasses.loss
        : resultClasses.tie;

  return (
    <Link
      href={`/matches/${match.id}`}
      className="block bg-card rounded-md overflow-hidden hover:bg-kanaliiga-light-brown/10 transition-colors"
    >
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-muted-foreground block">
              {formattedDate}
            </span>
            <span className="text-sm block mt-1">Map: {match.map_name}</span>
          </div>
          <span className={cn("font-bold", resultClass)}>
            {match.result.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-3">
            <Image
              src={match.opponent_logo}
              alt={`${match.opponent_name} logo`}
              width={32}
              height={32}
              className="rounded-full"
            />
            <span className="font-medium">{match.opponent_name}</span>
          </div>

          <div className="text-xl font-bold">
            {match.team_score} - {match.opponent_score}
          </div>
        </div>
      </div>
    </Link>
  );
};

const MatchCardSkeleton: React.FC = () => {
  return (
    <div className="bg-card rounded-md overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 w-24 bg-gray-800 rounded animate-pulse" />
            <div className="h-4 w-32 bg-gray-800 rounded animate-pulse" />
          </div>
          <div className="h-5 w-16 bg-gray-800 rounded animate-pulse" />
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-800 animate-pulse" />
            <div className="h-5 w-32 bg-gray-800 rounded animate-pulse" />
          </div>

          <div className="h-6 w-16 bg-gray-800 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
};
