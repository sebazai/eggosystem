"use client";

import { useState, useRef } from "react";
import { mutate } from "swr";
import { toast } from "sonner";
import { clientApiFetch, ApiError } from "@/lib/apiClient";
import { expressFetcher } from "@/lib/utils";
import type {
  Organizations,
  SignupNewOrganizationType
} from "@eggosystem/types";
import type { UseFormSetValue } from "react-hook-form";
import type { SignupFormValues } from "@eggosystem/types";

interface UseCreateOrganizationForSignupOptions {
  seasonId: string;
  setValue: UseFormSetValue<SignupFormValues>;
}

interface UseCreateOrganizationForSignupReturn {
  createOrganization: (
    organizationData: SignupNewOrganizationType
  ) => Promise<number | null>;
  isCreating: boolean;
}

/**
 * Hook to create an organization during signup flow
 * Handles organization creation, form state updates, cache invalidation, and draft updates
 */
export const useCreateOrganizationForSignup = ({
  seasonId,
  setValue
}: UseCreateOrganizationForSignupOptions): UseCreateOrganizationForSignupReturn => {
  const [isCreating, setIsCreating] = useState(false);
  const creationInProgressRef = useRef<string | null>(null);

  const createOrganization = async (
    organizationData: SignupNewOrganizationType
  ): Promise<number | null> => {
    if (
      !organizationData?.name ||
      !organizationData?.organization_code ||
      !organizationData?.website
    ) {
      toast.error("Please fill in all organization fields");
      return null;
    }

    // Check if we're already creating this exact organization
    const orgKey = `${organizationData.name}-${organizationData.organization_code}`;
    if (creationInProgressRef.current === orgKey) {
      console.log(
        "Organization creation already in progress, skipping duplicate call"
      );
      return null;
    }

    creationInProgressRef.current = orgKey;
    setIsCreating(true);
    try {
      const response = await clientApiFetch<{ organizationId: number }>(
        `/api/v1/registrations/season/${seasonId}/organization`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: organizationData.name,
            organization_code: organizationData.organization_code,
            website: organizationData.website,
            image_data: organizationData.image_data,
            image_filename: organizationData.image_filename
          })
        }
      );

      setValue("organizationId", response.organizationId, {
        shouldValidate: false,
        shouldDirty: false,
        shouldTouch: false
      });

      const orgsCacheKey = `/api/v1/organizations?includePending=true`;
      await mutate(orgsCacheKey, expressFetcher<Organizations[]>(orgsCacheKey));

      // Show success toast
      toast.success("Organization created successfully", {
        description: "You can now proceed to select or create a team."
      });

      return response.organizationId;
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message || "Failed to create organization");
      } else {
        toast.error("Failed to create organization. Please try again.");
      }
      console.error("Error creating organization:", error);
      return null;
    } finally {
      setIsCreating(false);
      creationInProgressRef.current = null;
    }
  };

  return {
    createOrganization,
    isCreating
  };
};
