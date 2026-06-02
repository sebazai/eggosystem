import type { ActiveSignupOrSeasonForAppId } from "@eggosystem/types";

type SeasonPhase = "live" | "signup" | "concluded";

export interface SeasonPhaseInfo {
  phase: SeasonPhase;
  seasonNumber: string | null;
  seasonName: string | null;
}

function extractSeasonNumber(
  season: ActiveSignupOrSeasonForAppId
): string | null {
  const seasonName =
    season.full_name || `Season ${season.season_id ?? "Unknown"}`;
  const seasonNumberMatch = seasonName.match(/Season\s+(\d+)/i);
  return seasonNumberMatch?.[1] ?? season.season_id?.toString() ?? null;
}

export function getSeasonPhaseInfo(
  season: ActiveSignupOrSeasonForAppId | undefined,
  now = new Date()
): SeasonPhaseInfo {
  if (!season) {
    return { phase: "concluded", seasonNumber: null, seasonName: null };
  }

  const startDate = season.start_date ? new Date(season.start_date) : null;
  const endDate = season.end_date ? new Date(season.end_date) : null;
  const signupStartDate = season.signup_start_date
    ? new Date(season.signup_start_date)
    : null;
  const signupEndDate = season.signup_end_date
    ? new Date(season.signup_end_date)
    : null;

  const seasonName =
    season.full_name || `Season ${season.season_id ?? "Unknown"}`;
  const seasonNumber = extractSeasonNumber(season);

  const isSeasonLive = Boolean(
    startDate && startDate <= now && (endDate === null || endDate >= now)
  );

  const isSignupOpen = Boolean(
    signupStartDate &&
    signupStartDate <= now &&
    signupEndDate &&
    signupEndDate >= now &&
    startDate &&
    startDate > now
  );

  if (isSeasonLive) {
    return { phase: "live", seasonNumber, seasonName };
  }

  if (isSignupOpen) {
    return { phase: "signup", seasonNumber, seasonName };
  }

  return { phase: "concluded", seasonNumber, seasonName };
}
