import { cn, createStatsKanaliigaImageUrl } from "@/lib/utils";
import type { MatchTeamInfo } from "@eggosystem/types";
import Image from "next/image";

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

  const formatTime = (date: Date) => date.toTimeString().slice(0, 5); // Extract HH:MM

  const formatDate = (date: Date) =>
    date
      .toLocaleDateString("en-US", { month: "short", day: "2-digit" })
      .toUpperCase();

  const formattedStart = formatTime(startDate);
  const formattedEnd = formatTime(endDate);
  const formattedDate = formatDate(startDate);

  return (
    <div
      className={cn(
        "w-full dark:bg-kanaliiga-orange/30 bg-kanaliiga-orange/50",
        className
      )}
    >
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-2">
        {/* Team 1 */}
        <div className="flex items-center gap-4 flex-1">
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold px-2 py-1 text-kanaliiga-orange">
                {team1.name}
              </span>
              <div className="h-8 w-8 relative hidden xs:block">
                <Image
                  src={createStatsKanaliigaImageUrl(team1.logo)}
                  alt={`${team1.name} logo`}
                  fill
                  className="object-contain"
                />
              </div>
            </div>
            {team1.rank && (
              <span className="text-sm text-zinc-400">
                Ranking #{team1.rank}
              </span>
            )}
          </div>
        </div>

        {/* Score */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-4">
            <span className="text-xl xs:text-4xl font-bold">{team1.score}</span>
            <span className="text-xs xs:text-lg text-zinc-400 uppercase">
              vs
            </span>
            <span className="text-xl xs:text-4xl font-bold">{team2.score}</span>
          </div>
          <div className="text-sm text-zinc-400">
            {formattedStart}–{formattedEnd}
          </div>
          <div>{formattedDate}</div>
        </div>

        {/* Team 2 */}
        <div className="flex items-center gap-4 flex-1 justify-end">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 relative hidden xs:block">
                <Image
                  src={createStatsKanaliigaImageUrl(team2.logo)}
                  alt={`${team2.name} logo`}
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-xl font-bold px-2 py-1 text-kanaliiga-orange">
                {team2.name}
              </span>
            </div>
            {team2.rank && (
              <span className="text-sm text-zinc-400">
                Ranking #{team2.rank}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
