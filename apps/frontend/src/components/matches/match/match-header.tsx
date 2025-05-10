import { NextImageFallback } from "@/components/layout/image-with-fallback";
import { cn, createTeamLogoUrl } from "@/lib/utils";
import type { MatchTeamInfo } from "@eggosystem/types";

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
    <div
      className={cn(
        "w-full dark:bg-kanaliiga-orange/30 bg-kanaliiga-orange/50",
        className
      )}
    >
      <div className="mx-auto px-4 py-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        {/* Team 1 */}
        <div className="flex flex-col-reverse md:flex-row items-center gap-2 text-center md:text-left justify-self-start">
          <div className="flex flex-col items-center md:items-start">
            <span className="text-md md:text-xl font-bold px-2 py-1 break-words max-w-50 lg:max-w-full">
              {team1.name}
            </span>
            <span className="text-xs md:text-sm text-zinc-400 px-2">
              Ranking #{team1.rank}
            </span>
          </div>
          <div className="h-10 w-10 md:h-14 md:w-14 relative">
            <NextImageFallback
              src={createTeamLogoUrl(team1.logo)}
              alt={`${team1.name} logo`}
              fill
              className="object-contain"
            />
          </div>
        </div>

        {/* Score (centered) */}
        <div className="flex flex-col items-center gap-1 justify-self-center text-center">
          <div className="flex items-center gap-2 sm:gap-4">
            <span
              className={cn(
                "text-xl xs:text-4xl font-bold",
                team1.score > team2.score ? "text-green-600" : "text-red-600"
              )}
            >
              {team1.score}
            </span>
            <span className="text-xs xs:text-lg">&mdash;</span>
            <span
              className={cn(
                "text-xl xs:text-4xl font-bold",
                team2.score > team1.score ? "text-green-600" : "text-red-600"
              )}
            >
              {team2.score}
            </span>
          </div>
          <div className="text-tiny md:text-sm">
            {formattedStart}–{formattedEnd}
          </div>
          <div className="text-xxs sm:text-sm">{formattedDate}</div>
        </div>

        {/* Team 2 */}
        <div className="flex flex-col-reverse md:flex-row-reverse items-center gap-2 text-center md:text-left justify-self-end">
          <div className="flex flex-col items-center md:items-start">
            <span className="text-md md:text-xl font-bold px-2 py-1 break-words max-w-50 lg:max-w-full">
              {team2.name}
            </span>
            <span className="text-xs md:text-sm text-zinc-400 px-2">
              Ranking #{team2.rank}
            </span>
          </div>
          <div className="h-10 w-10 md:h-14 md:w-14 relative">
            <NextImageFallback
              src={createTeamLogoUrl(team2.logo)}
              alt={`${team2.name} logo`}
              fill
              className="object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
