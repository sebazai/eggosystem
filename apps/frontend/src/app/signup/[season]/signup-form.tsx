"use client";
import { TheContainer } from "@/components/layout/the-container";
import { useSeason } from "@/hooks/data/useSeason";

interface SignupFormProps {
  seasonId: string;
}

export const SignupForm = ({ seasonId }: SignupFormProps) => {
  const { season, isLoading, isError, isValidating } = useSeason(seasonId);

  if (isLoading || isValidating) {
    return <TheContainer>Loading...</TheContainer>;
  }
  if (isError || !season) {
    return (
      <TheContainer>{isError?.message ?? "Season does not exist"}</TheContainer>
    );
  }
  return <div></div>;
};
