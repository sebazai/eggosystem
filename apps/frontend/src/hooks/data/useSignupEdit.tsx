"use client";

import { clientApiFetch } from "@/lib/apiClient";
import type { SignupFormValues } from "@eggosystem/types";
import useSWR from "swr";

interface UseSignupEditProps {
  seasonId: string;
  teamId: string;
}

export const useSignupEdit = ({ seasonId, teamId }: UseSignupEditProps) => {
  const apiUrl = `/api/v1/registrations/season/${seasonId}/signup/team/${teamId}`;

  const { data, error, isValidating, isLoading, mutate } =
    useSWR<SignupFormValues>(apiUrl, clientApiFetch, {
      revalidateOnFocus: false
    });

  return {
    signupEditData: data,
    isLoading,
    isError: error,
    isValidating,
    mutate
  };
};
