"use client";

import { cn } from "@/lib/utils";
import type { MatchTeamInfo } from "@eggosystem/types";
import { TeamDisplay } from "./team-display";

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
  const startDate = new Date(`${matchDate}T${matchStartTime}`);
  const endDate = new Date(`${matchDate}T${matchEndTime}`);

  const formatTime = (date: Date) => date.toTimeString().slice(0, 5); // HH:MM
  const formatDate = (date: Date) =>
    date
      .toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "2-digit"
      })
      .toUpperCase(); // MMM DD, YY

  const formattedStart = formatTime(startDate);
  const formattedEnd = formatTime(endDate);
  const formattedDate = formatDate(startDate);

  const getScoreTextColor = (score1: number, score2: number) => {
    if (score1 > score2) return "text-green-500";
    if (score1 < score2) return "text-red-400";
    return "text-white";
  };

  const team1ScoreColor = getScoreTextColor(team1.score, team2.score);
  const team2ScoreColor = getScoreTextColor(team2.score, team1.score);

  return (
    <div
      className={cn(
        "w-full flex flex-row items-stretch rounded-lg overflow-hidden bg-transparent",
        className
      )}
    >
      {/* Team 1 */}
      <div className="flex-1 flex items-center justify-end gap-2 px-4 py-6 bg-[#2a1314]">
        <TeamDisplay team={team1} logoRight />
      </div>
      {/* Score 1 */}
      <div className="flex items-center justify-center px-4 py-6 bg-[#181217]">
        <span
          className={cn("font-extrabold text-4xl md:text-5xl", team1ScoreColor)}
        >
          {team1.score}
        </span>
      </div>
      {/* Info */}
      <div className="flex flex-col items-center justify-center px-4 py-6 bg-[#181217] text-xs text-zinc-400">
        <span>{`${formattedStart}–${formattedEnd}`}</span>
        <span>{formattedDate}</span>
      </div>
      {/* Score 2 */}
      <div className="flex items-center justify-center px-4 py-6 bg-[#181217]">
        <span
          className={cn("font-extrabold text-4xl md:text-5xl", team2ScoreColor)}
        >
          {team2.score}
        </span>
      </div>
      {/* Team 2 */}
      <div className="flex-1 flex items-center justify-start gap-2 px-4 py-6 bg-[#2a1314]">
        <TeamDisplay team={team2} />
      </div>
    </div>
  );
}
