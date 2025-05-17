import type { GameTeamRoundBreakdown, MatchTeamStats } from "@eggosystem/types";
import Link from "next/link";
import { RoundBreakdown } from "./round-breakdown";
import type { TeamStatsFilters } from "./team-statistics";

export const TeamStatBox = ({
  team,
  teamStatsFilters,
  roundBreakDown
}: {
  team: MatchTeamStats;
  teamStatsFilters: TeamStatsFilters;
  roundBreakDown?: GameTeamRoundBreakdown;
}) => {
  return (
    <div className="p-4">
      <Link
        href={{
          pathname: `/teams/${team.team_id}`,
          query: new URLSearchParams({ ...teamStatsFilters }).toString()
        }}
        className="hover:bg-kanaliiga-light-brown/40 py-1 rounded transition-colors inline-block mb-4"
      >
        <h3 className="text-base font-bold text-kanaliiga-orange">
          {team.name}
        </h3>
      </Link>

      <div className="space-y-3">
        {roundBreakDown && (
          <RoundBreakdown
            startingSide={roundBreakDown.starting_side}
            roundWonFirstHalf={roundBreakDown.rounds_won_first_half}
            roundsWonSecondHalf={roundBreakDown.rounds_won_second_half}
            overtimeRoundsWon={roundBreakDown.total_overtime_rounds_won}
          />
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">First kills</span>
          <span>{team.first_kills}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Clutches won</span>
          <span>{team.clutches_won}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Bombs planted</span>
          <span>{team.plants}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Trades</span>
          <span>{team.trades}</span>
        </div>
      </div>
    </div>
  );
};
