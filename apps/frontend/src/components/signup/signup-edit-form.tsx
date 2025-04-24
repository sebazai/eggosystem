"use client";

import { useSignupEdit } from "@/hooks/data/useSignupEdit";
import type { SeasonPlatform } from "@eggosystem/types";
import { ContentContainer } from "../layout/content-container";
import { SignupForm } from "./signup-form";

interface SignupFormProps {
  seasonId: string;
  teamId: string;
  platform: SeasonPlatform;
}

export const SignupEditForm = ({
  seasonId,
  teamId,
  platform
}: SignupFormProps) => {
  const { signupEditData, isLoading, isValidating, isError } = useSignupEdit({
    seasonId,
    teamId
  });

  if (isLoading || isValidating) {
    return <ContentContainer>Loading form data...</ContentContainer>;
  }

  if (isError || !signupEditData) {
    return (
      <ContentContainer>
        {isError?.message ?? "Something went wrong..."}
      </ContentContainer>
    );
  }

  return (
    <SignupForm
      seasonId={seasonId}
      platform={platform}
      editValues={signupEditData}
    />
  );
};
