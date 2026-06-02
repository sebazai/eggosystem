"use client";

import { useMemo } from "react";
import { useActiveSignupOrActiveSeasonForApp } from "@/hooks/data/useActiveSignupOrActiveSeasonForApp";
import { useActiveSeason } from "@/hooks/data/dashboard/useActiveSeason";
import { getSeasonPhaseInfo } from "@/lib/season-phase";

const CS2_APP_ID = 730;

export function useLandingSeasonContext(appId = CS2_APP_ID) {
  const {
    signupOrActiveSeason,
    isLoading: isLoadingSignupSeason,
    isError: isSignupSeasonError,
    isValidating: isValidatingSignupSeason
  } = useActiveSignupOrActiveSeasonForApp(appId);

  const {
    activeSeasonId,
    isLoading: isLoadingActiveSeason,
    isError: isActiveSeasonError,
    isValidating: isValidatingActiveSeason
  } = useActiveSeason();

  const seasonPhase = useMemo(
    () => getSeasonPhaseInfo(signupOrActiveSeason),
    [signupOrActiveSeason]
  );

  const referenceSeasonId =
    signupOrActiveSeason?.season_id ?? activeSeasonId ?? null;

  const isLoading = isLoadingSignupSeason || isLoadingActiveSeason;

  return {
    signupOrActiveSeason,
    seasonPhase,
    referenceSeasonId,
    isLoading,
    isError: isSignupSeasonError || isActiveSeasonError,
    isValidating: isValidatingSignupSeason || isValidatingActiveSeason
  };
}
