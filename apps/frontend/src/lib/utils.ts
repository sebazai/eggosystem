import type { Nullable } from "@eggosystem/types";
import { clsx, type ClassValue } from "clsx";
import type { ReadonlyURLSearchParams } from "next/navigation";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getParamArray = (
  searchParams: ReadonlyURLSearchParams,
  key: string
) =>
  searchParams
    .getAll(key)
    .map(Number)
    .filter((n) => !isNaN(n))
    .sort();

export interface FilterParamsQuery {
  seasons: Nullable<number[]>;
  leagues: Nullable<number[]>;
  stages: Nullable<number[]>;
  teams: Nullable<number[]>;
  maps: Nullable<number[]>;
  steamId?: string;
}

export const generateFiltersParamQuery = ({
  seasons,
  leagues,
  stages,
  teams,
  maps
}: FilterParamsQuery) => {
  const params = new URLSearchParams();

  if (seasons?.length)
    seasons.forEach((season) => params.append("season_ids", String(season)));
  if (leagues?.length)
    leagues.forEach((league) => params.append("league_ids", String(league)));
  if (stages?.length)
    stages.forEach((stage) => params.append("stages", String(stage)));
  if (teams?.length)
    teams.forEach((team) => params.append("team_ids", String(team)));
  if (maps?.length)
    maps.forEach((map) => params.append("map_ids", String(map)));

  const sortedQuery = Array.from(params.entries())
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  return sortedQuery;
};

export const expressFetcher = async <T>(
  ...args: [RequestInfo, RequestInit?]
): Promise<T> => {
  // eslint-disable-next-line prefer-const
  let [url, options] = args;

  // Prepend NEXT_PUBLIC_BASE_PATH if defined
  const basePath = process.env.NEXT_PUBLIC_API_URL;
  if (typeof url === "string" && basePath) {
    url = `${basePath}${url}`;
  }

  const res = await fetch(url, options);
  if (!res.ok) {
    const resultJson = await res.json();
    throw new Error(resultJson.message ?? "An error occurred");
  }
  return res.json();
};

export const createNextImageUrl = (url: string) => {
  if (process.env.NEXT_PUBLIC_BASE_PATH) {
    return `${process.env.NEXT_PUBLIC_BASE_PATH}${url}`;
  }
  return url;
};

export const createStatsKanaliigaImageUrl = (url: string) => {
  return `https://stats.kanaliiga.fi/img/${url}`;
};
