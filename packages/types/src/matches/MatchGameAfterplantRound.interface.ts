import type { RoundEndReasonInfo } from "../enums/RoundEndReasonInfo";
import type { Team } from "../db";

export interface AfterplantKillEvent {
  victim_steam_id: string;
  victim_team: "CT" | "T";
  killer_steam_id: string;
  /** Absolute seconds from the start of the round */
  time_in_round: number;
  /** True when the killer was themselves killed within ~5 s of this kill (trade) */
  is_traded: boolean;
}

export interface MatchGameAfterplantRound {
  round_number: number;
  plant_site: "A" | "B";
  /** JSON blob stored as a string in the DB; parsed before returning from the API */
  ct_t: {
    T: string[];
    CT: string[];
  } | null;
  round_end_reason_info: RoundEndReasonInfo;
  ct_team_id: Team["id"];
  t_team_id: Team["id"];
  /** Number of T-side players alive at bomb plant */
  t_alive_at_plant: number;
  /** Number of CT-side players alive at bomb plant */
  ct_alive_at_plant: number;
  ct_team_name: string;
  t_team_name: string;
  ct_team_logo: string | null;
  t_team_logo: string | null;
  /** All kills that occurred after the bomb was planted in this round, sorted by time */
  kills_after_plant: AfterplantKillEvent[];
}
