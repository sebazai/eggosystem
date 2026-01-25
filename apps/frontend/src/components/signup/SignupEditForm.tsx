"use client";

import { useSignupEdit } from "@/hooks/data/useSignupEdit";
import type { SeasonPlatform } from "@eggosystem/types";
import { ContentContainer } from "../layout/ContentContainer";
import { SignupForm } from "./SignupForm";
import { CardSkeleton } from "@/components/loading";

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

  if (isError || !signupEditData) {
    return (
      <ContentContainer>
        {isError?.message ?? "Something went wrong..."}
      </ContentContainer>
    );
  }

  if (isLoading || isValidating) {
    return (
      <div className="space-y-4">
        <CardSkeleton showHeader={true} contentLines={4} />
        <CardSkeleton showHeader={true} contentLines={6} />
        <CardSkeleton showHeader={true} contentLines={5} />
      </div>
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
