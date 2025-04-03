import { MapRoundStat } from "@eggosystem/types";

export interface MatchRoundInfo {
  round_number: MapRoundStat["round_number"];
  round_end_reason_info: MapRoundStat["round_end_reason_info"];
  ct_team_id: MapRoundStat["ct_team_id"];
  t_team_id: MapRoundStat["t_team_id"];
  plant_site: MapRoundStat["plant_site"];
  first_kill: MapRoundStat["first_kill"];
}
