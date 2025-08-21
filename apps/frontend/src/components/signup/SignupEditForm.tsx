"use client";

import { useSignupEdit } from "@/hooks/data/useSignupEdit";
import type { SeasonPlatform } from "@eggosystem/types";
import { ContentContainer } from "../layout/ContentContainer";
import { SignupForm } from "./SignupForm";

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
  const { signupEditData, isLoading, isValidating, isError, mutate } =
    useSignupEdit({
      seasonId,
      teamId
    });

  if (isError || !signupEditData) {
    return (
      <ContentContainer>
        {isError?.message ?? "Something went wrong..."}
      </ContentContainer>
    );
  }

  if (isLoading || isValidating) {
    return <ContentContainer>Loading form data...</ContentContainer>;
  }

  return (
    <SignupForm
      seasonId={seasonId}
      platform={platform}
      editValues={signupEditData}
      onDraftSaved={mutate}
    />
  );
};
