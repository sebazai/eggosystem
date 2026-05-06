import { useState, useEffect } from "react";
import { SeasonDetails } from "@eggosystem/types";
import { clientApiFetch } from "../lib/apiClient";

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
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (!seasonId) return;

    const fetchSeasonDetails = async () => {
      setIsLoading(true);
      setIsError(null);
      try {
        const data: SeasonDetails = await clientApiFetch<SeasonDetails>(
          `/api/v1/dashboard/seasons/${seasonId}`
        );
        setSeasonDetails(data);
      } catch (error) {
        if (error instanceof Error) {
          setIsError(error);
        } else {
          setIsError(new Error("Unknown error occurred"));
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchSeasonDetails();
  }, [seasonId]);

  return {
    seasonDetails,
    isLoading,
    isError,
    isValidating
  };
};
