"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";

/**
 * Hook to manage dashboard season selection via URL search params.
 * Reads and writes the `season` parameter from the URL.
 *
 * @returns Object with selectedSeasonId (string | null) and setSelectedSeasonId function
 */
export const useDashboardSeason = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get the season parameter from URL or null
  const seasonParam = searchParams.get("season");
  const selectedSeasonId = seasonParam || null;

  const setSelectedSeasonId = useCallback(
    (seasonId: string | null) => {
      const params = new URLSearchParams(searchParams.toString());

      if (seasonId) {
        params.set("season", seasonId);
      } else {
        params.delete("season");
      }

      // Update URL without adding to history (replace current entry)
      const newUrl = params.toString()
        ? `${pathname}?${params.toString()}`
        : pathname;
      router.push(newUrl, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  return useMemo(
    () => ({
      selectedSeasonId,
      setSelectedSeasonId
    }),
    [selectedSeasonId, setSelectedSeasonId]
  );
};
