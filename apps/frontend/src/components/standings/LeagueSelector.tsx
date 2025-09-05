"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import type { StandingsLeagues } from "@eggosystem/types";

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

  return (
    <Select value={selectedLeague.external_id} onValueChange={onLeagueChange}>
      <SelectTrigger className="min-w-[200px]">
        <SelectValue placeholder="Select League">
          {selectedLeague.external_league_name}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {allLeagues.map((league) => (
          <SelectItem key={league.external_id} value={league.external_id}>
            {league.external_league_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
