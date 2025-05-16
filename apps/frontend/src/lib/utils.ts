import { envConfig } from "@/configs/env";
import type { Nullable } from "@eggosystem/types";
import { clsx, type ClassValue } from "clsx";
import type { ReadonlyURLSearchParams } from "next/navigation";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const mapToReadableName = (map: string) => {
  return map.split("_")[1]?.toUpperCase() ?? map;
};

export const mapToReadableNameCapitalFirst = (map: string) => {
  const mapSplit = map.split("_")[1];
  if (mapSplit) {
    const firstChar = mapSplit.charAt(0).toUpperCase();
    const restOfMap = mapSplit.slice(1);
    return firstChar.concat(restOfMap);
  }
  return map;
};

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
  const basePath = envConfig.API_URL;
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

export const createBaseUrl = () => {
  if (envConfig.BASE_PATH) {
    return `${envConfig.BASE_URL}${envConfig.BASE_PATH}`;
  }
  return envConfig.BASE_URL;
};

export const createNextUrl = (url: string) => {
  if (envConfig.BASE_PATH) {
    return `${envConfig.BASE_PATH}${url}`;
  }
  return url;
};

export const createDashboardNextUrl = (url: string) => {
  if (envConfig.BASE_PATH) {
    return `${envConfig.BASE_PATH}/dashboard/${url}`;
  }
  return `/dashboard/${url}`;
};

export const createTeamLogoUrl = (url: string) => {
  if (!url) return "";

  // If the URL is already absolute, return it as is
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // Ensure the URL starts with a leading slash for Next.js image component
  return createNextUrl(`/teams/${url}`);
};
