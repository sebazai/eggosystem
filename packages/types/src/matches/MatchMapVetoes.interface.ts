import { MatchTeamMapVeto, Map } from "../index";

export interface MatchMapVetoes {
  id: MatchTeamMapVeto["id"];
  match_id: MatchTeamMapVeto["match_id"];
  team_id: MatchTeamMapVeto["team_id"];
  map_id: MatchTeamMapVeto["map_id"];
  map_name: Map["name"];
  action: MatchTeamMapVeto["action"];
  veto_order: MatchTeamMapVeto["veto_order"];
}
