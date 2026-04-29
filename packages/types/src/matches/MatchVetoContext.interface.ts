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
  /** `Matches.best_of` from the database row. */
  stored_best_of: Match["best_of"];
  /**
   * Recommended veto format for new entry: BO2 when season `is_round_robin_bo2_as_2xbo1`
   * and stage 1 BO1; otherwise same as `stored_best_of`.
   */
  default_veto_best_of: number;
  /**
   * Which veto pattern was used for existing rows, inferred from action sequence; null if none
   * or if the sequence does not match a known template.
   */
  recorded_veto_best_of: number | null;
  /** FACEIT hub room id for deep links. */
  external_match_room_id: Match["external_match_room_id"];
  /**
   * Effective format for the veto template in this response (`recorded_veto_best_of` when
   * vetoes exist and inference succeeds, else `default_veto_best_of`).
   */
  best_of: number;
  status: Match["status"];
  teams: MatchVetoContextTeam[];
  map_pool: Map[];
  vetoes: MatchVetoContextVeto[];
  template: VetoTemplate | null;
}
