"use client";

import { useRouter } from "next/navigation";
import { useSeasonLeagues } from "@/hooks/data/useSeasonLeagues";
import { usePlayoffBracket } from "@/hooks/data/usePlayoffBracket";
import { PlayoffBracket } from "@/components/playoff/PlayoffBracket";
import { ContentContainer } from "@/components/layout/ContentContainer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { createNextUrl } from "@/lib/utils";

export function PlayoffPageContent({
  seasonId,
  leagueId
}: {
  seasonId: string;
  leagueId: string;
}) {
  const router = useRouter();
  const { seasonLeagues, isLoading: isLoadingLeagues } =
    useSeasonLeagues(seasonId);
  const {
    data: bracketData,
    isLoading,
    error
  } = usePlayoffBracket(seasonId, leagueId);

  const handleLeagueChange = (newLeagueId: string) => {
    router.push(
      createNextUrl(`/seasons/${seasonId}/leagues/${newLeagueId}/playoff`)
    );
  };

  if (isLoadingLeagues) {
    return (
      <ContentContainer>
        <p className="text-muted-foreground">Loading leagues…</p>
      </ContentContainer>
    );
  }

  return (
    <ContentContainer classNames="flex-col items-stretch w-full max-w-full">
      {/* Own row: full-width header, then brackets below */}
      <div className="flex w-full flex-col">
        <header className="w-full border-b border-border pb-4 mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-bold uppercase tracking-wider text-kanaliiga-orange">
              Playoff bracket
            </h1>
            {seasonLeagues && seasonLeagues.length > 0 && (
              <div className="flex items-center gap-2">
                <label
                  htmlFor="playoff-league-select"
                  className="text-sm font-medium text-muted-foreground"
                >
                  League
                </label>
                <Select
                  value={leagueId}
                  onValueChange={handleLeagueChange}
                  name="league"
                >
                  <SelectTrigger
                    id="playoff-league-select"
                    className="w-[200px]"
                  >
                    <SelectValue placeholder="Select league" />
                  </SelectTrigger>
                  <SelectContent>
                    {seasonLeagues.map((league) => (
                      <SelectItem key={league.id} value={String(league.id)}>
                        {league.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </header>

        {/* Bracket content row below */}
        {error && (
          <p className="text-destructive">Failed to load playoff bracket.</p>
        )}

        {!error && isLoading && (
          <p className="text-muted-foreground">Loading bracket…</p>
        )}

        {!error &&
          !isLoading &&
          (!bracketData || bracketData.matches.length === 0) && (
            <p className="text-muted-foreground">
              No playoff matches for this league yet.
            </p>
          )}

        {!error &&
          !isLoading &&
          bracketData &&
          bracketData.matches.length > 0 && (
            <PlayoffBracket
              matches={bracketData.matches}
              bracket={bracketData.bracket}
            />
          )}
      </div>
    </ContentContainer>
  );
}
