"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSignupStatus } from "@/hooks/data/useSignupStatus";
import { SignupForm } from "./SignupForm";
import { ContentContainer } from "@/components/layout/ContentContainer";
import type { SeasonPlatform } from "@eggosystem/types";

interface SignupFormWithDraftProps {
  seasonId: string;
  platform: SeasonPlatform;
}

export const SignupFormWithDraft = ({
  seasonId,
  platform
}: SignupFormWithDraftProps) => {
  const router = useRouter();
  const { signupStatus, isLoading, isError, mutate } =
    useSignupStatus(seasonId);

  // Handle redirect to edit page if user has existing registration
  useEffect(() => {
    if (signupStatus?.shouldRedirectToEdit && signupStatus.redirectUrl) {
      router.replace(signupStatus.redirectUrl);
    }
  }, [signupStatus, router]);

  // Show loading state while checking user status
  if (isLoading) {
    return (
      <ContentContainer classNames="w-full">
        Checking your registration status...
      </ContentContainer>
    );
  }

  // Show error state if there's an authentication error
  if (isError) {
    console.error("Error checking signup status:", isError);
  }

  // Don't render SignupForm if we're redirecting
  if (signupStatus?.shouldRedirectToEdit) {
    return (
      <ContentContainer classNames="w-full">
        Redirecting to your team edit page...
      </ContentContainer>
    );
  }

  const handleDraftSaved = () => {
    mutate();
  };

  return (
    <SignupForm
      seasonId={seasonId}
      platform={platform}
      draft={signupStatus?.draft}
      onDraftSaved={handleDraftSaved}
    />
  );
};
