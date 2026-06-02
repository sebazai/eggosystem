"use client";

import { expressFetcher } from "@/lib/utils";
import type { KanaLeaderboardResponse, KanaTier } from "@eggosystem/types";
import useSWR from "swr";

/**
 * Fetch the kana elo leaderboard for a single tier from
 * GET /v1/kana-leaderboard?tier=<tier>.
 *
 * A tier is always supplied — the leaderboard is per-tier only (there is no
 * unfiltered overall view). `entries` is the global top-50 slice belonging to
 * the selected tier, ordered highest kana elo first, with each row's global
 * `position` preserved (never renumbered by the filter).
 */
export const useKanaLeaderboard = (tier: KanaTier) => {
  const { data, error, isLoading, isValidating, mutate } =
    useSWR<KanaLeaderboardResponse>(
      `/api/v1/kana-leaderboard?tier=${encodeURIComponent(tier)}`,
      expressFetcher,
      {
        revalidateOnFocus: false
      }
    );

  return {
    entries: data?.players,
    isLoading,
    isValidating,
    isError: error,
    retry: () => {
      mutate();
    }
  };
};
