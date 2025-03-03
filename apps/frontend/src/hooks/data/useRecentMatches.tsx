"use client";

import { fetcher } from "@/lib/utils";
import useSWR from "swr";
import type { MatchesByFilters } from "@eggosystem/types";

interface UseRecentMatchesProps {
  seasons: number[];
  leagues: number[];
  stages: number[];
  teams: number[];
  maps: number[];
}

export const useRecentMatches = ({
  seasons,
  leagues,
  stages,
  teams,
  maps
}: UseRecentMatchesProps) => {
  const params = new URLSearchParams();

  if (seasons.length)
    seasons.forEach((season) => params.append("seasons", String(season)));
  if (leagues.length)
    leagues.forEach((league) => params.append("leagues", String(league)));
  if (stages.length)
    stages.forEach((stage) => params.append("stages", String(stage)));
  if (teams.length)
    teams.forEach((team) => params.append("teams", String(team)));
  if (maps.length) maps.forEach((map) => params.append("maps", String(map)));

  const sortedQuery = Array.from(params.entries())
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  const { data, error, isValidating } = useSWR<MatchesByFilters[]>(
    `/api/matches/recent?${sortedQuery}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  return {
    matches: data,
    isLoading: !data && !error,
    isError: error,
    isValidating
  };
};
