import useSWR from "swr";
import { clientApiFetch } from "@/lib/apiClient";

interface DiscordInviteLinkResponse {
  discord_invite_link: string | null;
}

export function useOrganizationDiscordInviteLink(organizationId?: number) {
  const shouldFetch = typeof organizationId === "number" && organizationId > 0;
  const { data, error, isLoading } = useSWR<DiscordInviteLinkResponse, Error>(
    shouldFetch
      ? `/api/v1/organizations/${organizationId}/discord-invite-link`
      : null,
    clientApiFetch,
    { revalidateOnFocus: false }
  );

  return {
    discordInviteLink: data?.discord_invite_link ?? null,
    isLoading,
    error
  };
}
