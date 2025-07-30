"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { LEAGUES, type League } from "@/types/standings";

interface LeagueSelectorProps {
  selectedLeague: string;
  onLeagueChange: (leagueId: string) => void;
}

export const LeagueSelector = ({
  selectedLeague,
  onLeagueChange
}: LeagueSelectorProps) => {
  const selectedLeagueName =
    LEAGUES.find((league) => league.id === selectedLeague)?.name ||
    "Select League";

  return (
    <Select value={selectedLeague} onValueChange={onLeagueChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select League">
          {selectedLeagueName}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {LEAGUES.map((league: League) => (
          <SelectItem key={league.id} value={league.id}>
            {league.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
