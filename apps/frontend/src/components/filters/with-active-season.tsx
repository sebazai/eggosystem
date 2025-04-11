import { useActiveSeason } from "@/hooks/data/useActiveSeason";
import { TheContainer } from "../layout/the-container";
import type React from "react";

export const WithActiveSeason = ({
  children
}: {
  children: React.ReactNode;
}) => {
  const activeSeasonHook = useActiveSeason("730");

  if (activeSeasonHook.isError) {
    return <TheContainer>Failed to fetch active season</TheContainer>;
  }

  if (
    activeSeasonHook.isLoading ||
    activeSeasonHook.isValidating ||
    !activeSeasonHook.activeSeason
  ) {
    return <TheContainer>Fetching active season...</TheContainer>;
  }
  return <>{children}</>;
};
