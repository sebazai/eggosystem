"use client";

import useSWR, { type KeyedMutator } from "swr";
import { useCallback, useState } from "react";
import { mutate } from "swr";
import { toast } from "sonner";
import { clientApiFetch, ApiError, extractErrorMessage } from "@/lib/apiClient";
import type {
  CasterApplication,
  CasterApplicationResponse,
  OrganizerWithCasterApplications
} from "@eggosystem/types";
import type { CasterApplicationFormValues } from "@/components/profile/caster-application-form-schema";

const ORGANIZERS_WITH_CASTER_KEY =
  "/api/v1/organizers/with-caster-applications";
const CASTER_ME_KEY = "/api/v1/caster-applications/me";
const CASTER_PENDING_COUNT_KEY =
  "/api/v1/dashboard/caster-applications/pending-count";

function casterApplicationsKey(organizerId?: number | null) {
  if (organizerId == null) return "/api/v1/dashboard/caster-applications";
  return `/api/v1/dashboard/caster-applications?organizer_id=${organizerId}`;
}

export function useOrganizersWithCasterApplications(): {
  organizers: OrganizerWithCasterApplications[];
  isLoading: boolean;
  isError: Error | undefined;
  isValidating: boolean;
  mutate: KeyedMutator<{ organizers?: OrganizerWithCasterApplications[] }>;
} {
  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate: revalidate
  } = useSWR<{ organizers?: OrganizerWithCasterApplications[] }, Error>(
    ORGANIZERS_WITH_CASTER_KEY,
    clientApiFetch,
    { revalidateOnFocus: false }
  );

  return {
    organizers: data && Array.isArray(data.organizers) ? data.organizers : [],
    isLoading,
    isError: error,
    isValidating,
    mutate: revalidate
  };
}

export function useMyCasterApplications(organizerId?: number | null): {
  applications: CasterApplication[];
  isLoading: boolean;
  isError: Error | undefined;
  isValidating: boolean;
  mutate: KeyedMutator<{ applications?: CasterApplication[] }>;
} {
  const key =
    organizerId != null
      ? `${CASTER_ME_KEY}?organizer_id=${organizerId}`
      : CASTER_ME_KEY;
  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate: revalidate
  } = useSWR<{ applications?: CasterApplication[] }, Error>(
    key,
    clientApiFetch,
    { revalidateOnFocus: false }
  );

  return {
    applications:
      data && Array.isArray(data.applications) ? data.applications : [],
    isLoading,
    isError: error,
    isValidating,
    mutate: revalidate
  };
}

export function useSubmitCasterApplication(organizerId: number) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = useCallback(
    async (values: CasterApplicationFormValues) => {
      setIsSubmitting(true);
      try {
        await clientApiFetch(
          `/api/v1/organizers/${organizerId}/caster-applications`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              caster_url: values.caster_url,
              approved_terms_and_conditions:
                values.approved_terms_and_conditions
            })
          }
        );
        await mutate(CASTER_ME_KEY);
        await mutate(ORGANIZERS_WITH_CASTER_KEY);
        toast.success("Caster application submitted successfully.");
      } catch (err) {
        const message =
          err instanceof ApiError
            ? (err.detail ?? err.message)
            : extractErrorMessage(err);
        toast.error(message ?? "Failed to submit application.");
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [organizerId]
  );

  return { submit, isSubmitting };
}

export function useCasterApplications(organizerId?: number | null): {
  applications: CasterApplicationResponse[];
  isLoading: boolean;
  isError: Error | undefined;
  isValidating: boolean;
  mutate: KeyedMutator<{ applications?: CasterApplicationResponse[] }>;
} {
  const key = casterApplicationsKey(organizerId);
  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate: revalidate
  } = useSWR<{ applications?: CasterApplicationResponse[] }, Error>(
    key,
    clientApiFetch,
    { revalidateOnFocus: false }
  );

  return {
    applications:
      data && Array.isArray(data.applications) ? data.applications : [],
    isLoading,
    isError: error,
    isValidating,
    mutate: revalidate
  };
}

export function usePendingCasterApplicationsCount(
  organizerId?: number | null,
  options?: { enabled?: boolean }
): {
  pendingCount: number;
  isLoading: boolean;
  isError: Error | undefined;
  mutate: KeyedMutator<{ count: number }>;
} {
  const enabled = options?.enabled !== false;
  const key = enabled
    ? organizerId != null
      ? `${CASTER_PENDING_COUNT_KEY}?organizer_id=${organizerId}`
      : CASTER_PENDING_COUNT_KEY
    : null;
  const {
    data,
    error,
    isLoading,
    mutate: revalidate
  } = useSWR<{ count: number }, Error>(key, clientApiFetch, {
    revalidateOnFocus: true
  });

  return {
    pendingCount: data?.count ?? 0,
    isLoading,
    isError: error,
    mutate: revalidate
  };
}

export function useApproveCasterApplication() {
  const [isApproving, setIsApproving] = useState(false);

  const approve = useCallback(async (applicationId: number) => {
    setIsApproving(true);
    try {
      await clientApiFetch(
        `/api/v1/dashboard/caster-applications/${applicationId}/approve`,
        { method: "POST" }
      );
      await mutate(CASTER_PENDING_COUNT_KEY);
      await mutate(
        (k) =>
          typeof k === "string" &&
          (k.startsWith("/api/v1/caster-applications") ||
            k.startsWith("/api/v1/dashboard/caster-applications"))
      );
      await mutate(
        (k) =>
          typeof k === "string" &&
          k.includes("/organizers/") &&
          k.includes("/caster-applications")
      );
      toast.success("Application approved.");
    } catch (err) {
      const message =
        err instanceof ApiError
          ? (err.detail ?? err.message)
          : extractErrorMessage(err);
      toast.error(message ?? "Failed to approve application.");
      throw err;
    } finally {
      setIsApproving(false);
    }
  }, []);

  return { approve, isApproving };
}

export function useRejectCasterApplication() {
  const [isRejecting, setIsRejecting] = useState(false);

  const reject = useCallback(
    async (applicationId: number, rejectionReason: string) => {
      setIsRejecting(true);
      try {
        await clientApiFetch(
          `/api/v1/dashboard/caster-applications/${applicationId}/reject`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rejection_reason: rejectionReason })
          }
        );
        await mutate(CASTER_PENDING_COUNT_KEY);
        await mutate(
          (k) =>
            typeof k === "string" &&
            (k.startsWith("/api/v1/caster-applications") ||
              k.startsWith("/api/v1/dashboard/caster-applications"))
        );
        await mutate(
          (k) =>
            typeof k === "string" &&
            k.includes("/organizers/") &&
            k.includes("/caster-applications")
        );
        toast.success("Application rejected.");
      } catch (err) {
        const message =
          err instanceof ApiError
            ? (err.detail ?? err.message)
            : extractErrorMessage(err);
        toast.error(message ?? "Failed to reject application.");
        throw err;
      } finally {
        setIsRejecting(false);
      }
    },
    []
  );

  return { reject, isRejecting };
}
