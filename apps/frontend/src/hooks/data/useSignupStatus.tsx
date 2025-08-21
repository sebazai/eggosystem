"use client";

import { useAuth } from "@/context/AuthContext";
import { clientApiFetch, ApiError } from "@/lib/apiClient";
import useSWR from "swr";
import type { SignupFormValues } from "@eggosystem/types";

interface MyRegistration {
  teamId: number;
}

interface SignupStatusData {
  shouldRedirectToEdit: boolean;
  redirectUrl?: string;
  draft?: SignupFormValues;
  hasExistingRegistration: boolean;
  hasDraft: boolean;
}

interface UseSignupStatusReturn {
  signupStatus: SignupStatusData | undefined;
  isLoading: boolean;
  isError: Error | undefined;
  isValidating: boolean;
  mutate: () => void;
}

export const useSignupStatus = (seasonId: string): UseSignupStatusReturn => {
  const { user, loading: userLoading } = useAuth();

  const shouldFetch = user && !userLoading;

  const fetcher = async (): Promise<SignupStatusData> => {
    if (!shouldFetch) {
      return {
        shouldRedirectToEdit: false,
        hasExistingRegistration: false,
        hasDraft: false
      };
    }

    let hasExistingRegistration = false;
    let hasDraft = false;
    let draftData: SignupFormValues | undefined;

    try {
      const registration = await clientApiFetch<MyRegistration>(
        `/api/v1/registrations/season/${seasonId}/my-registration`
      );
      hasExistingRegistration = true;

      if (registration.teamId) {
        return {
          shouldRedirectToEdit: true,
          redirectUrl: `/seasons/${seasonId}/signup/team/${registration.teamId}/edit`,
          hasExistingRegistration: true,
          hasDraft: false
        };
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        // No existing registration
      } else if (error instanceof ApiError && error.status === 401) {
        throw error;
      } else {
        throw error;
      }
    }

    if (!hasExistingRegistration) {
      try {
        draftData = await clientApiFetch<SignupFormValues>(
          `/api/v1/registrations/season/${seasonId}/draft`
        );
        hasDraft = true;
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          // No draft
        } else if (error instanceof ApiError && error.status === 401) {
          throw error;
        } else {
          throw error;
        }
      }
    }

    return {
      shouldRedirectToEdit: false,
      draft: draftData,
      hasExistingRegistration,
      hasDraft
    };
  };

  const {
    data,
    error,
    isLoading: _swrLoading,
    isValidating,
    mutate
  } = useSWR<SignupStatusData, Error>(
    shouldFetch ? `signup-status-${seasonId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5 * 60 * 1000, // 5 minutes cache
      shouldRetryOnError: (error) => {
        // Don't retry on 401 (auth) or 404 (not found) errors
        if (error instanceof ApiError) {
          return ![401, 404].includes(error.status);
        }
        return true;
      }
    }
  );

  return {
    signupStatus: data,
    isLoading: (shouldFetch && !data && !error) || userLoading,
    isError: error,
    isValidating,
    mutate
  };
};
