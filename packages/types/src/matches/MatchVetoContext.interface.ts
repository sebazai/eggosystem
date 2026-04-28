import type { Match, Map, MatchTeamMapVeto, Team } from "../db/index";
import type { VetoTemplate } from "../veto-templates/VetoTemplate.interface";

export interface MatchVetoContextVeto {
  id: MatchTeamMapVeto["id"];
  team_id: MatchTeamMapVeto["team_id"];
  team_name: string;
  map_id: MatchTeamMapVeto["map_id"];
  map_name: Map["name"];
  action: MatchTeamMapVeto["action"];
  veto_order: MatchTeamMapVeto["veto_order"];
}

export interface MatchVetoContextTeam {
  team_id: Team["id"];
  team_name: string;
}

export interface MatchVetoContext {
  match_id: Match["id"];
  best_of: Match["best_of"];
  status: Match["status"];
  teams: MatchVetoContextTeam[];
  map_pool: Map[];
  vetoes: MatchVetoContextVeto[];
  template: VetoTemplate | null;
}
