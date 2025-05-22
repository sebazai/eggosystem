import { NextImageFallback } from "@/components/layout/image-with-fallback";
import {
  cn,
  createNextUrl,
  createTeamLogoUrl,
  filterParamsToSearchParams
} from "@/lib/utils";
import type { MatchTeamInfo } from "@eggosystem/types";
import Link from "next/link";

interface MatchHeaderProps {
  team1: MatchTeamInfo;
  team2: MatchTeamInfo;
  matchStartTime: string;
  matchEndTime: string;
  matchDate: string;
  seasonName: string;
  seasonId: number;
  leagueName: string;
  leagueId: number;
  className?: string;
}

export function MatchHeader({
  team1,
  team2,
  matchStartTime,
  matchEndTime,
  matchDate,
  seasonName,
  seasonId,
  leagueName,
  leagueId,
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
        "w-full dark:bg-kanaliiga-orange/30 bg-kanaliiga-orange/50",
        className
      )}
    >
      <div className="mx-auto px-4 py-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2 md:gap-4">
        {/* Team 1 */}
        <div className="flex flex-col-reverse md:flex-row items-center gap-2 text-center md:text-left justify-self-start md:justify-self-end">
          <div className="flex flex-col items-center md:items-start">
            <Link
              href={{
                pathname: createNextUrl(`/teams/${team1.id}`),
                query: new URLSearchParams({
                  seasons: seasonId.toString(),
                  leagues: leagueId.toString()
                }).toString()
              }}
              className="text-md md:text-xl font-bold px-2 py-1 break-words max-w-50 lg:max-w-full"
            >
              {team1.name}
            </Link>
            <span className="text-xs md:text-sm text-muted-foreground px-2">
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
          {/* Score 1 */}
          <div className="flex items-center gap-1 justify-self-center text-center">
            <div className="flex items-center justify-center px-2 py-4">
              <span
                className={cn(
                  "font-extrabold text-4xl md:text-5xl",
                  team1ScoreColor
                )}
              >
                {team1.score}
              </span>
            </div>
            {/* Info */}
            <div className="hidden xs:flex flex-col items-center justify-center px-4 py-6 text-xxs md:text-xs text-muted-foreground">
              <span>{`${formattedStart}–${formattedEnd}`}</span>
              <span>{formattedDate}</span>
              <span>
                {seasonName} {leagueName}
              </span>
            </div>
            <div className="xs:hidden">-</div>
            {/* Score 2 */}
            <div className="flex items-center justify-center px-2 py-4">
              <span
                className={cn(
                  "font-extrabold text-4xl md:text-5xl",
                  team2ScoreColor
                )}
              >
                {team2.score}
              </span>
            </div>
          </div>
          <div className="block xs:hidden text-xxs md:text-xs text-muted-foreground">
            {seasonName} {leagueName}
          </div>
        </div>

        {/* Team 2 */}
        <div className="flex flex-col-reverse md:flex-row-reverse items-center gap-2 text-center md:text-left justify-self-end md:justify-self-start">
          <div className="flex flex-col items-center md:items-start">
            <Link
              href={{
                pathname: createNextUrl(`/teams/${team2.id}`),
                query: filterParamsToSearchParams({
                  seasons: [seasonId],
                  leagues: [leagueId]
                }).toString()
              }}
              className="text-md md:text-xl font-bold px-2 py-1 break-words max-w-50 lg:max-w-full"
            >
              {team2.name}
            </Link>
            <span className="text-xs md:text-sm text-muted-foreground px-2">
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
