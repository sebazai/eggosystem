"use client";

import { expressFetcher } from "@/lib/utils";
import useSWR from "swr";
import type { MatchesByFilters } from "@eggosystem/types";

interface UseRecentMatchesProps {
  seasons: number[];
  leagues: number[];
  stages: number[];
  teams: number[];
}

export const useRecentMatches = ({
  seasons,
  leagues,
  stages,
  teams
}: UseRecentMatchesProps) => {
  const params = new URLSearchParams();

  if (seasons.length)
    seasons.forEach((season) => params.append("season_ids[]", String(season)));
  if (leagues.length)
    leagues.forEach((league) => params.append("league_ids[]", String(league)));
  if (stages.length)
    stages.forEach((stage) => params.append("stages[]", String(stage)));
  if (teams.length)
    teams.forEach((team) => params.append("team_ids[]", String(team)));

  const sortedQuery = Array.from(params.entries())
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  const { data, error, isValidating } = useSWR<MatchesByFilters[]>(
    `/api/v1/matches/recent?${sortedQuery}`,
    expressFetcher,
    { revalidateOnFocus: false }
  );

  return {
    matches: data,
    isLoading: !data && !error,
    isError: error,
    isValidating
  };
};
