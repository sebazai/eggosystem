"use client";

import { TierDot } from "@/components/kanaliiga";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

type LeagueSelectorOption = {
  id: string;
  name: string;
  tier?: number | null;
};

export function LeagueSelector({
  value,
  onValueChange,
  leagues,
  placeholder = "Select league",
  triggerClassName = "min-w-[200px]",
  name,
  id
}: {
  value: string | null;
  onValueChange: (leagueId: string) => void;
  leagues: LeagueSelectorOption[];
  placeholder?: string;
  triggerClassName?: string;
  name?: string;
  id?: string;
}) {
  const selected = leagues.find((l) => l.id === value) ?? null;

  return (
    <Select value={value ?? ""} onValueChange={onValueChange} name={name}>
      <SelectTrigger id={id} className={triggerClassName}>
        <SelectValue placeholder={placeholder}>
          {selected ? (
            <span className="flex items-center gap-2">
              {typeof selected.tier === "number" ? (
                <TierDot tier={selected.tier} />
              ) : null}
              {selected.name}
            </span>
          ) : null}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {leagues.map((league) => (
          <SelectItem key={league.id} value={league.id}>
            <span className="flex items-center gap-2">
              {typeof league.tier === "number" ? (
                <TierDot tier={league.tier} />
              ) : null}
              {league.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
