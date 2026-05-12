"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";

type LeaderboardViewMode = "division" | "overall";

/**
 * Hook to manage fantasy leaderboard view mode via URL search params.
 * Reads and writes the `view` parameter from the URL.
 * Defaults to "division" when no parameter is present.
 *
 * @returns Object with viewMode and setViewMode function
 */
export const useLeaderboardViewMode = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const viewModeParam = searchParams.get("view");
  const viewMode: LeaderboardViewMode =
    viewModeParam === "overall" ? "overall" : "division";

  const setViewMode = useCallback(
    (mode: LeaderboardViewMode) => {
      const params = new URLSearchParams(searchParams.toString());

      if (mode === "overall") {
        params.set("view", "overall");
      } else {
        params.delete("view"); // Default to division, don't need param
      }

      const newUrl = params.toString()
        ? `${pathname}?${params.toString()}`
        : pathname;
      router.replace(newUrl, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  return useMemo(
    () => ({
      viewMode,
      setViewMode
    }),
    [viewMode, setViewMode]
  );
};
