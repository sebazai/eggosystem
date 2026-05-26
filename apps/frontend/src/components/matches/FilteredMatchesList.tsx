"use client";

import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { ContentContainer } from "../layout/ContentContainer";
import { expressFetcher, type FilterParamsQuery } from "@/lib/utils";
import { useRecentMatches } from "@/hooks/data/filtered/useRecentMatches";
import { MatchListSkeleton } from "@/components/loading";
import { DateGroup } from "./DateGroup";
import { MatchCard } from "./MatchCard";
import type { MatchesByFilters, Season, League } from "@eggosystem/types";

function abbrevSeasonName(fullName: string): string {
  return fullName.replace(/Season\s+/i, "S");
}

type SortKey = "newest" | "oldest" | "tier";

function sortMatches(
  matches: MatchesByFilters[],
  sort: SortKey,
  leagueSortMap: Record<string, number>
): MatchesByFilters[] {
  if (sort === "oldest") {
    return [...matches].sort(
      (a, b) =>
        new Date(a.start_timestamp).getTime() -
        new Date(b.start_timestamp).getTime()
    );
  }
  if (sort === "tier") {
    return [...matches].sort((a, b) => {
      const ra = leagueSortMap[a.league_name.toLowerCase()] ?? 999;
      const rb = leagueSortMap[b.league_name.toLowerCase()] ?? 999;
      if (ra !== rb) return ra - rb;
      return (
        new Date(b.start_timestamp).getTime() -
        new Date(a.start_timestamp).getTime()
      );
    });
  }
  // "newest" — API returns DESC by default; ensure stable client-side order
  return [...matches].sort(
    (a, b) =>
      new Date(b.start_timestamp).getTime() -
      new Date(a.start_timestamp).getTime()
  );
}

interface FilteredMatchesListProps {
  filterQueryParams: FilterParamsQuery;
}

export const FilteredMatchesList = ({
  filterQueryParams
}: FilteredMatchesListProps) => {
  const searchParams = useSearchParams();
  const sort = (searchParams.get("sort") as SortKey | null) ?? "newest";

  const { matches, isError, isLoading, isValidating } =
    useRecentMatches(filterQueryParams);

  const { data: seasons } = useSWR<Season[]>(
    "/api/v1/seasons",
    expressFetcher,
    { revalidateOnFocus: false, keepPreviousData: true }
  );

  const { data: leagues } = useSWR<League[]>(
    "/api/v1/leagues",
    expressFetcher,
    { revalidateOnFocus: false, keepPreviousData: true }
  );

  const seasonLabelMap = (seasons ?? []).reduce<Record<number, string>>(
    (acc, s) => {
      acc[s.id] = abbrevSeasonName(s.full_name);
      return acc;
    },
    {}
  );

  // name → sort_priority from DB (1 = top tier). Used for "tier" sort order.
  const leagueSortMap = (leagues ?? []).reduce<Record<string, number>>(
    (acc, l) => {
      acc[l.name.toLowerCase()] = l.sort_priority;
      return acc;
    },
    {}
  );

  if (isLoading || isValidating) {
    return <MatchListSkeleton />;
  }

  if (isError) {
    return <ContentContainer>Error loading Matches</ContentContainer>;
  }

  if (!matches) {
    return <ContentContainer>No matches found</ContentContainer>;
  }

  const showSeason =
    !filterQueryParams.seasons || filterQueryParams.seasons.length !== 1;

  const sorted = sortMatches(matches, sort, leagueSortMap);

  const groupedMatches = sorted.reduce(
    (acc, match) => {
      const matchDate = match.match_date;
      if (!acc[matchDate]) {
        acc[matchDate] = [];
      }
      acc[matchDate]?.push(match);
      return acc;
    },
    {} as Record<string, typeof sorted>
  );

  // Preserve sort order for date-group keys
  const orderedDates = Array.from(new Set(sorted.map((m) => m.match_date)));

  return (
    <div className="min-w-0 w-full">
      {orderedDates.map((date) => {
        const matchesForDate = groupedMatches[date] ?? [];
        return (
          <DateGroup key={date} date={date} count={matchesForDate.length}>
            {matchesForDate.map((match) => {
              const href = match.match_game_id
                ? `/matches/${match.match_id}/games/${match.match_game_id}`
                : `/matches/${match.match_id}`;
              const seasonLabel =
                seasonLabelMap[match.season_id] ?? `S${match.season_id}`;
              return (
                <MatchCard
                  key={match.match_id}
                  match={match}
                  href={href}
                  showSeason={showSeason}
                  seasonLabel={seasonLabel}
                />
              );
            })}
          </DateGroup>
        );
      })}
    </div>
  );
};
