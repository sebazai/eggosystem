import { envConfig } from "@/configs/env";
import type { Nullable } from "@eggosystem/types";
import {
  isValidSteamId as sharedIsValidSteamId,
  convertSteamIdToSteamId64 as sharedConvertSteamIdToSteamId64,
  convertSteamId3ToSteamId64 as sharedConvertSteamId3ToSteamId64,
  SeasonPlatform
} from "@eggosystem/types";
import { clsx, type ClassValue } from "clsx";
import type { ReadonlyURLSearchParams } from "next/navigation";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const mapToReadableName = (map: string) => {
  return map.split("_")[1]?.toUpperCase() ?? map.toUpperCase();
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
  player_name?: Nullable<string>;
  steamId?: string;
}

export const generateFiltersParamQuery = ({
  seasons,
  leagues,
  stages,
  teams,
  maps,
  player_name
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
  if (player_name) params.append("player_name", player_name);

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
  const isInternalApi =
    typeof url === "string" && basePath && url.startsWith("/api/");

  if (typeof url === "string" && url.startsWith("/") && basePath) {
    url = `${basePath}${url}`;
  }

  try {
    const res = await fetch(url, options);

    if (!res.ok) {
      let errorMessage = `API request failed with status ${res.status}`;

      try {
        const resultJson = await res.json();

        // For internal APIs, try to use RFC 7807 error format
        if (isInternalApi && resultJson) {
          // Check if it's an RFC 7807 error response
          if (resultJson.detail && resultJson.status && resultJson.type) {
            errorMessage = resultJson.detail;
          }
          // Check for legacy error format
          else if (resultJson.error) {
            errorMessage = resultJson.error;
          }
          // Check for generic message field
          else if (resultJson.message) {
            errorMessage = resultJson.message;
          }
        }
        // For external APIs, just try to get a message
        else if (resultJson?.message) {
          errorMessage = resultJson.message;
        }
      } catch (parseError) {
        // If parsing fails, use the default error message
        console.error("Failed to parse error response:", parseError);
      }

      // Create error with additional properties
      const error = new Error(errorMessage) as Error & { status?: number };
      error.status = res.status;
      throw error;
    }

    // For non-JSON responses (rare edge case)
    const contentType = res.headers.get("content-type");
    if (contentType && !contentType.includes("application/json")) {
      console.warn("Non-JSON response received:", contentType);
      return {} as T;
    }

    return res.json();
  } catch (error) {
    console.error(
      `API fetch error for ${typeof url === "string" ? url : "request"}:`,
      error
    );
    throw error;
  }
};

export const createBaseUrl = (path?: string) => {
  if (envConfig.BASE_PATH) {
    return `${envConfig.BASE_URL}${envConfig.BASE_PATH}${path ?? ""}`;
  }
  return `${envConfig.BASE_URL}${path ?? ""}`;
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

export const createOrgLogoUrl = (url: string) => {
  if (!url) return "";

  // If the URL is already absolute, return it as is
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // Ensure the URL starts with a leading slash for Next.js image component
  return createNextUrl(`/organization-images/${url}`);
};

export const createTeamLogoUrl = (url: string) => {
  if (!url) return "";

  // If the URL is already absolute, return it as is
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // Ensure the URL starts with a leading slash for Next.js image component
  return createNextUrl(`/team-images/${url}`);
};

export function filterParamsToSearchParams(
  filterParams: Partial<FilterParamsQuery> | null,
  excludeKeys: (keyof FilterParamsQuery)[] = []
): URLSearchParams {
  const params = new URLSearchParams();

  if (!filterParams) return params;

  for (const [key, value] of Object.entries(filterParams) as [
    keyof FilterParamsQuery,
    unknown
  ][]) {
    if (excludeKeys.includes(key)) continue;

    if (!value) continue;

    if (Array.isArray(value)) {
      value.forEach((v) => {
        if (v != null) {
          params.append(key, v.toString());
        }
      });
    } else if (typeof value === "string") {
      params.append(key, value);
    }
  }

  return params;
}

export const convertSeasonToS = (season: string) => {
  return season.replace("Season ", "S");
};

export const isValidSteamId = sharedIsValidSteamId;

/**
 * Resolves any Steam ID format (SteamID64, SteamID, SteamID3, or custom URL) to SteamID64.
 * For formats that require API calls (custom URLs), returns null if resolution fails.
 * For formats that can be converted locally (SteamID, SteamID3, /profiles/ URLs), returns null if conversion fails.
 * Uses BigInt to handle large SteamID64 values that exceed JavaScript's safe integer limit.
 *
 * @param input The Steam ID input in any format
 * @returns Resolved SteamID64 or null if resolution fails (for custom URLs or invalid formats)
 */
export const resolveSteamIdToSteamId64 = async (
  input: string
): Promise<string | null> => {
  // If it's already a valid SteamID64, return it
  if (isValidSteamId(input)) {
    return input;
  }

  // If empty, return null
  if (!input.trim()) {
    return null;
  }

  const trimmed = input.trim();

  // Extract SteamID64 from /profiles/ URLs (these contain SteamID64 directly)
  // Handles formats like:
  // - https://steamcommunity.com/profiles/76561198049745649
  // - http://steamcommunity.com/profiles/76561198049745649
  // - steamcommunity.com/profiles/76561198049745649
  // - /profiles/76561198049745649
  const profileMatch = trimmed.match(
    /(?:https?:\/\/)?(?:www\.)?steamcommunity\.com\/profiles\/(\d{17})(?:\/|$|\?|#)/i
  );
  if (profileMatch && profileMatch[1]) {
    const steamId64 = profileMatch[1];
    if (isValidSteamId(steamId64)) {
      return steamId64;
    }
  }

  // Try local conversion first (SteamID and SteamID3 formats)
  // SteamID format: STEAM_X:Y:Z
  if (trimmed.startsWith("STEAM_")) {
    try {
      const steamId64 = sharedConvertSteamIdToSteamId64(trimmed);
      if (isValidSteamId(steamId64)) {
        return steamId64;
      }
    } catch {
      // Invalid format, continue to check SteamID3
    }
  }

  // SteamID3 format: [U:1:AccountID]
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const steamId64 = sharedConvertSteamId3ToSteamId64(trimmed);
      if (isValidSteamId(steamId64)) {
        return steamId64;
      }
    } catch {
      // Invalid format, return null
    }
  }

  // For custom URLs, we need to call the API
  // This will be handled by the caller using the resolve endpoint
  return null;
};

export const createPlatformTeamUrl = (
  externalPlatformId: string | null,
  platform: SeasonPlatform = SeasonPlatform.FACEIT
) => {
  if (!externalPlatformId) return null;

  switch (platform) {
    case SeasonPlatform.FACEIT:
      return `https://www.faceit.com/en/teams/${externalPlatformId}`;
    case SeasonPlatform.Esportal:
      return `https://esportal.com/team/${externalPlatformId}`;
    case SeasonPlatform.PopFlash:
      return `https://popflash.site/team/${externalPlatformId}`;
    case SeasonPlatform.Kanaliiga:
      return `/teams/${externalPlatformId}`;
    default:
      return null;
  }
};

export const createExternalMatchRoomUrl = (
  externalMatchId: string | null,
  platform: SeasonPlatform
) => {
  if (!externalMatchId) return null;
  switch (platform) {
    case SeasonPlatform.FACEIT:
      return `https://www.faceit.com/en/cs2/room/${externalMatchId}`;
    default:
      return null;
  }
};
