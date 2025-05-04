import { MapRoundStat, MatchGame, Team } from "@eggosystem/types";

export interface MapRoundInfo extends MapRoundStat {
  regulation_rounds: MatchGame["regulation_rounds"];
  ct_name: Team["name"];
  ct_logo: Team["team_logo"];
  t_name: Team["name"];
  t_logo: Team["team_logo"];
}
