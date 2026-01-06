import type { GameClip } from "@eggosystem/types";
import { TeamStatBox } from "./TeamStatBox";
import { useGameTeamRoundBreakdowns } from "@/hooks/data/useGameTeamRoundBreakdowns";
import { useTeamStats } from "@/hooks/data/useTeamStats";
import { cn } from "@/lib/utils";
import { ProcessingSpinner } from "@/components/ui/icons";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";

export interface TeamStatsFilters {
  seasons: string;
  leagues: string;
}

interface TeamStatisticsProps {
  teamStatsFilters: TeamStatsFilters;
  clip?: GameClip;
  matchId?: number;
  matchGameId?: number;
}

export const TeamStatistics = ({
  teamStatsFilters,
  clip,
  matchId,
  matchGameId
}: TeamStatisticsProps) => {
  const auth = useAuth();

  // Fetch team stats based on whether we have matchId or matchGameId
  const { teamStats } = useTeamStats({ matchId, matchGameId });
  const { teamsRoundBreakdown } = useGameTeamRoundBreakdowns(matchGameId);

  // Early return if no stats available yet
  if (!teamStats || teamStats.length === 0) {
    return null;
  }

  const [teamOneStats, teamTwoStats] = teamStats;
  const teamOneId = teamOneStats?.team_id;
  const teamTwoId = teamTwoStats?.team_id;
  const clipAndClipStatusNotError = clip && clip.clip_status !== "Error";
  return (
    <div
      className={cn(
        "grid xl:flex grid-cols-1 sm:grid-cols-2 xl:flex-row gap-4 w-full",
        clipAndClipStatusNotError ? "gap-4" : "gap-4 md:gap-10"
      )}
    >
      {/* Video */}
      {clipAndClipStatusNotError && (
        <div
          className={cn(
            "min-w-0 flex flex-col",
            "order-1 xl:order-2 col-span-1 sm:col-span-2 xl:col-auto w-full xl:flex-[3] xl:basis-3/5",
            "md:border-l md:border-r md:border-kanaliiga-orange"
          )}
        >
          <h3 className="mb-2 text-center">
            {clip.clip_title} - by {clip.nickname}
          </h3>
          {clip.clip_url && clip.clip_status === "Processed" && (
            <iframe
              allow="clipboard-write"
              allowFullScreen
              src={
                auth.user?.provider === "steam"
                  ? clip.clip_url.concat(`&UID=${auth.user?.provider_id}`)
                  : clip.clip_url
              }
              className="w-full h-full min-h-[200px] xs:min-h-[300px] sm:min-h-[350px] md:min-h-[400px] lg:min-h-[450px]"
            ></iframe>
          )}
          {clip.clip_status === "Submitted" && clip.clip_thumbnail_url && (
            <div className="relative w-full h-full min-h-[200px] xs:min-h-[300px] sm:min-h-[350px] md:min-h-[400px] lg:min-h-[450px] text-center flex items-center justify-center">
              <Image
                src={clip.clip_thumbnail_url}
                alt="Clip submitted"
                width={1024}
                height={576}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          {clip.clip_status === "Processing" && (
            <div className="relative w-full h-full min-h-[200px] xs:min-h-[300px] sm:min-h-[350px] md:min-h-[400px] lg:min-h-[450px] text-center flex items-center justify-center">
              <ProcessingSpinner />
            </div>
          )}
        </div>
      )}

      {/* Team 1 Stats */}
      <div
        className={cn(
          "min-w-0 flex flex-col",
          clipAndClipStatusNotError
            ? "order-2 xl:order-1 col-span-1 w-full xl:w-auto basis-1/5"
            : "flex-1"
        )}
      >
        {teamOneStats && (
          <TeamStatBox
            team={teamOneStats}
            teamStatsFilters={teamStatsFilters}
            roundBreakDown={teamsRoundBreakdown?.find(
              (val) => val.team_id === teamOneId
            )}
          />
        )}
      </div>

      {/* Team 2 Stats */}
      <div
        className={cn(
          "min-w-0 flex flex-col",
          clipAndClipStatusNotError
            ? "order-2 xl:order-3 col-span-1 w-full xl:w-auto basis-1/5"
            : "flex-1"
        )}
      >
        {teamTwoStats && (
          <TeamStatBox
            team={teamTwoStats}
            teamStatsFilters={teamStatsFilters}
            roundBreakDown={teamsRoundBreakdown?.find(
              (val) => val.team_id === teamTwoId
            )}
          />
        )}
      </div>
    </div>
  );
};
