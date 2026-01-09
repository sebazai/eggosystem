import { useState } from "react";
import useSWR, { mutate } from "swr";
import { clientApiFetch } from "@/lib/apiClient";
import type {
  SeasonLeagueWithMappings,
  SeasonLeagueExternalId,
  CreateSeasonLeagueExternalIdRequest,
  UpdateSeasonLeagueExternalIdRequest,
  UpdateLeagueNameRequest
} from "@eggosystem/types";
import { toast } from "sonner";

/**
 * Hook to fetch SeasonLeagues with their mappings for a given season
 */
export const useSeasonLeaguesWithMappings = (seasonId: number | null) => {
  const { data, error, isLoading } = useSWR<SeasonLeagueWithMappings[]>(
    seasonId
      ? `/api/v1/dashboard/season-league-mapper/season/${seasonId}/season-leagues`
      : null,
    clientApiFetch,
    { revalidateOnFocus: false }
  );

  return {
    data,
    error,
    isLoading
  };
};

/**
 * Hook to fetch a single mapping by ID
 */
const useSeasonLeagueExternalId = (id: number | null) => {
  const { data, error, isLoading } = useSWR<SeasonLeagueExternalId>(
    id ? `/api/v1/dashboard/season-league-mapper/${id}` : null,
    clientApiFetch,
    { revalidateOnFocus: false }
  );

  return {
    data,
    error,
    isLoading
  };
};

/**
 * Hook to create a new mapping
 */
export const useCreateSeasonLeagueExternalId = () => {
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = async (data: CreateSeasonLeagueExternalIdRequest) => {
    setIsPending(true);
    try {
      const result = await clientApiFetch<{ id: number }>(
        "/api/v1/dashboard/season-league-mapper",
        {
          method: "POST",
          body: JSON.stringify(data)
        }
      );
      toast.success("Mapping created successfully");
      // Revalidate the season leagues query
      await mutate(
        `/api/v1/dashboard/season-league-mapper/season/${data.season_id}/season-leagues`
      );
      return result;
    } catch (error) {
      toast.error(
        `Failed to create mapping: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      throw error;
    } finally {
      setIsPending(false);
    }
  };

  return {
    mutateAsync,
    isPending
  };
};

/**
 * Hook to update an existing mapping
 */
export const useUpdateSeasonLeagueExternalId = () => {
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = async ({
    id,
    data
  }: {
    id: number;
    data: UpdateSeasonLeagueExternalIdRequest;
  }) => {
    setIsPending(true);
    try {
      const result = await clientApiFetch<{ message: string }>(
        `/api/v1/dashboard/season-league-mapper/${id}`,
        {
          method: "PUT",
          body: JSON.stringify(data)
        }
      );
      toast.success("Mapping updated successfully");
      // Revalidate all season leagues queries
      await mutate(
        (key) =>
          typeof key === "string" &&
          key.includes("/api/v1/dashboard/season-league-mapper/season/")
      );
      return result;
    } catch (error) {
      toast.error(
        `Failed to update mapping: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      throw error;
    } finally {
      setIsPending(false);
    }
  };

  return {
    mutateAsync,
    isPending
  };
};

/**
 * Hook to delete a mapping
 */
export const useDeleteSeasonLeagueExternalId = () => {
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = async (id: number) => {
    setIsPending(true);
    try {
      const result = await clientApiFetch<{ message: string }>(
        `/api/v1/dashboard/season-league-mapper/${id}`,
        {
          method: "DELETE"
        }
      );
      toast.success("Mapping deleted successfully");
      // Revalidate all season leagues queries
      await mutate(
        (key) =>
          typeof key === "string" &&
          key.includes("/api/v1/dashboard/season-league-mapper/season/")
      );
      return result;
    } catch (error) {
      toast.error(
        `Failed to delete mapping: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      throw error;
    } finally {
      setIsPending(false);
    }
  };

  return {
    mutateAsync,
    isPending
  };
};

/**
 * Hook to update a league name
 */
export const useUpdateLeagueName = () => {
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = async ({
    leagueId,
    name
  }: {
    leagueId: number;
    name: string;
  }) => {
    setIsPending(true);
    try {
      const data: UpdateLeagueNameRequest = { name };
      const result = await clientApiFetch<{ message: string }>(
        `/api/v1/dashboard/season-league-mapper/league/${leagueId}/name`,
        {
          method: "PUT",
          body: JSON.stringify(data)
        }
      );
      toast.success("League name updated successfully");
      // Revalidate all season leagues queries to refetch with updated name
      await mutate(
        (key) =>
          typeof key === "string" &&
          key.includes("/api/v1/dashboard/season-league-mapper/season/")
      );
      return result;
    } catch (error) {
      toast.error(
        `Failed to update league name: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      throw error;
    } finally {
      setIsPending(false);
    }
  };

  return {
    mutateAsync,
    isPending
  };
};
