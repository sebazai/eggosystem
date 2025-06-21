import useSWR from "swr";
import { expressFetcher } from "@/lib/utils";

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
  const { data, error, isValidating, isLoading } = useSWR<
    KanahautomoOrgStatusResponse,
    Error
  >("/api/v1/kanahautomo/organization-status", expressFetcher, {
    revalidateOnFocus: false
  });

  return {
    orgStatus: data?.organizations ?? [],
    orgStatusLoading: isLoading,
    orgStatusError: error,
    isValidating
  };
}
