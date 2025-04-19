import { useActiveSeason } from "@/hooks/data/useActiveSeason";
import { TheContainer } from "../layout/the-container";
import type React from "react";

export const WithActiveSeason = ({
  children
}: {
  children: React.ReactNode;
}) => {
  const { isError, isLoading, isValidating, activeSeason, filterParams } =
    useActiveSeason("730");

  if (isError) {
    return <TheContainer>Failed to fetch active season</TheContainer>;
  }

  if (isLoading || isValidating || !activeSeason || !filterParams) {
    return <TheContainer>Fetching active season...</TheContainer>;
  }
  return <>{children}</>;
};
