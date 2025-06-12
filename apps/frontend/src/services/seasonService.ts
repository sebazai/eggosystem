import { nextFetcher } from "@/lib/fetcher";
import type { Season } from "@/components/sortter/SeasonSelector";

/**
 * Fetches all available seasons
 * @returns Promise containing array of seasons
 */
export async function fetchSeasons(): Promise<Season[]> {
  return nextFetcher<Season[]>("/api/v1/seasons");
}
