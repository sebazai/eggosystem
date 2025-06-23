import useSWR from "swr";
import { clientApiFetch } from "@/lib/apiClient";
import type { KanahautomoOrganizationStatus } from "@eggosystem/types";

interface KanahautomoOrgStatusResponse {
  organizations: KanahautomoOrganizationStatus[];
}

export function useKanahautomoOrganizationStatus() {
  const { data, error, isValidating, isLoading, mutate } = useSWR<
    KanahautomoOrgStatusResponse,
    Error
  >("/api/v1/kanahautomo/organization-status", clientApiFetch, {
    revalidateOnFocus: false
  });

  return {
    orgStatus: data?.organizations ?? [],
    orgStatusLoading: isLoading,
    orgStatusError: error,
    isValidating,
    mutate
  };
}
