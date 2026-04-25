"use client";

import type { StandingsLeagues } from "@eggosystem/types";
import { LeagueSelector as SharedLeagueSelector } from "@/components/league/LeagueSelector";

interface LeagueSelectorProps {
  selectedLeague: StandingsLeagues | null;
  allLeagues: StandingsLeagues[];
  onLeagueChange: (leagueId: string) => void;
}

export const LeagueSelector = ({
  selectedLeague,
  onLeagueChange,
  allLeagues
}: LeagueSelectorProps) => {
  if (!selectedLeague) {
    return null;
  }

  const leagues = (
    allLeagues.length > 0 ? allLeagues : [selectedLeague]
  ).filter(
    (league, idx, arr) =>
      arr.findIndex((l) => l.external_id === league.external_id) === idx
  );

  return (
    <SharedLeagueSelector
      value={selectedLeague.external_id}
      onValueChange={onLeagueChange}
      placeholder="Select league"
      leagues={leagues.map((l) => ({
        id: l.external_id,
        name: l.external_league_name,
        tier: l.tier
      }))}
    />
  );
};
