import { expressFetcher } from "@/lib/utils";
import useSWR from "swr";

interface EntryKill {
  round_number: number;
  time_in_round: number;
  killer_steam_id: string;
  victim_steam_id: string;
  killer_team: "T" | "CT";
  victim_team: "T" | "CT";
  setup_flash_thrower: string | null;
  victim_blind_seconds: number | null;
  was_victim_traded: boolean | null;
}

interface EntryKillsResponse {
  entry_kills: EntryKill[];
}

export const useEntryKills = (matchGameId: number) => {
  const { data, error, isLoading } = useSWR<EntryKillsResponse>(
    `/api/v1/match-games/${matchGameId}/entry-kills`,
    expressFetcher,
    { revalidateOnFocus: false }
  );

  return {
    entryKills: data?.entry_kills ?? [],
    isLoading,
    isError: error
  };
};
