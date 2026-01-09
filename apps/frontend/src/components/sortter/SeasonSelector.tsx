"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";

interface Season {
  id: number;
  name: string;
}

interface SeasonSelectorProps {
  seasons: Season[];
  selectedSeason: number | null;
  onChange: (seasonId: number) => void;
  isLoading?: boolean;
}

export function SeasonSelector({
  seasons,
  selectedSeason,
  onChange,
  isLoading = false
}: SeasonSelectorProps) {
  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Spinner size="sm" />
        <span>Loading seasons...</span>
      </div>
    );
  }

  return (
    <Select
      value={selectedSeason?.toString() || ""}
      onValueChange={(value) => onChange(parseInt(value, 10))}
    >
      <SelectTrigger className="w-[120px]">
        <SelectValue placeholder="Select season" />
      </SelectTrigger>
      <SelectContent>
        {seasons.map((season) => (
          <SelectItem key={season.id} value={season.id.toString()}>
            {season.id}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
