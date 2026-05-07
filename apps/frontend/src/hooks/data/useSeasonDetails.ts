import { useState, useEffect } from "react";
import type { SeasonDetails } from "@eggosystem/types";
import { clientApiFetch } from "@/lib/apiClient";

interface UseSeasonDetailsResult {
  seasonDetails: SeasonDetails | null;
  isLoading: boolean;
  isError: Error | null;
  isValidating: boolean;
}

export const useSeasonDetails = (
  seasonId: string | number
): UseSeasonDetailsResult => {
  const [seasonDetails, setSeasonDetails] = useState<SeasonDetails | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState<Error | null>(null);
  const [isValidating] = useState(false);

  useEffect(() => {
    if (!seasonId) {
      setIsLoading(false);
      return;
    }

    let stale = false;

    const fetchSeasonDetails = async () => {
      setIsLoading(true);
      setIsError(null);
      try {
        const data: SeasonDetails = await clientApiFetch<SeasonDetails>(
          `/api/v1/seasons/${seasonId}/details`
        );
        if (!stale) {
          setSeasonDetails(data);
        }
      } catch (error) {
        if (!stale) {
          if (error instanceof Error) {
            setIsError(error);
          } else {
            setIsError(new Error("Unknown error occurred"));
          }
        }
      } finally {
        if (!stale) {
          setIsLoading(false);
        }
      }
    };

    fetchSeasonDetails();

    return () => {
      stale = true;
    };
  }, [seasonId]);

  return {
    seasonDetails,
    isLoading,
    isError,
    isValidating
  };
};
