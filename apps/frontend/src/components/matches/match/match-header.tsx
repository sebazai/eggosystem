"use client";

import { NextImageFallback } from "@/components/layout/image-with-fallback";
import { cn, createTeamLogoUrl } from "@/lib/utils";
import type { MatchTeamInfo } from "@eggosystem/types";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface MatchHeaderProps {
  team1: MatchTeamInfo;
  team2: MatchTeamInfo;
  matchStartTime: string;
  matchEndTime: string;
  matchDate: string;
  className?: string;
}

export function MatchHeader({
  team1,
  team2,
  matchStartTime,
  matchEndTime,
  matchDate,
  className
}: MatchHeaderProps) {
  const search = useSearchParams();
  const searchParams = search.size !== 0 ? search.toString() : "";

  const startDate = new Date(`${matchDate}T${matchStartTime}`);
  const endDate = new Date(`${matchDate}T${matchEndTime}`);

  const formatTime = (date: Date) => date.toTimeString().slice(0, 5); // Extract HH:MM

  const formatDate = (date: Date) =>
    date
      .toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "2-digit"
      })
      .toUpperCase();

  const formattedStart = formatTime(startDate);
  const formattedEnd = formatTime(endDate);
  const formattedDate = formatDate(startDate);

  return (
    <div className={cn("w-full dark:bg-[#2a1314] bg-[#2a1314]", className)}>
      <div className="mx-auto grid grid-cols-[1fr_auto_auto_auto_1fr] items-center">
        {/* Team 1 */}
        <div className="flex items-center justify-end">
          <Link
            href={{
              pathname: `/teams/${team1.id}`,
              query: searchParams
            }}
            className="flex items-center gap-2 hover:opacity-90 px-5 py-3"
          >
            <div className="text-right">
              <div className="text-xl font-bold">{team1.name}</div>
              <div className="text-xs text-zinc-400">Ranking #{team1.rank}</div>
            </div>
            <div className="h-14 w-14 relative">
              <NextImageFallback
                src={createTeamLogoUrl(team1.logo)}
                alt={`${team1.name} logo`}
                fill
                className="object-contain"
              />
            </div>
          </Link>
        </div>

        {/* Team 1 Score Box */}
        <div className="bg-[#561a1c] py-3 px-6">
          <div className="text-5xl font-bold text-white">{team1.score}</div>
        </div>

        {/* Time Box (centered) */}
        <div className="flex flex-col items-center justify-center py-3 px-5 bg-[#3d1517] text-xs text-zinc-400">
          <div>
            {formattedStart}–{formattedEnd}
          </div>
          <div>{formattedDate}</div>
        </div>

        {/* Team 2 Score Box */}
        <div className="bg-[#561a1c] py-3 px-6">
          <div className="text-5xl font-bold text-white">{team2.score}</div>
        </div>

        {/* Team 2 */}
        <div className="flex items-center justify-start">
          <Link
            href={{
              pathname: `/teams/${team2.id}`,
              query: searchParams
            }}
            className="flex items-center gap-2 hover:opacity-90 px-5 py-3"
          >
            <div className="h-14 w-14 relative">
              <NextImageFallback
                src={createTeamLogoUrl(team2.logo)}
                alt={`${team2.name} logo`}
                fill
                className="object-contain"
              />
            </div>
            <div>
              <div className="text-xl font-bold">{team2.name}</div>
              <div className="text-xs text-zinc-400">Ranking #{team2.rank}</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
