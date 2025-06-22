import useSWR from "swr";
import { clientApiFetch } from "@/lib/apiClient";

export interface KanahautomoOrgStatus {
  organization_id: number;
  organization_name: string;
  count: number;
  status: "ready" | "waiting";
}

interface KanahautomoOrgStatusResponse {
  organizations: KanahautomoOrgStatus[];
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
