import type { MatchTeamMapVeto } from "../db/MatchTeamMapVeto.interface";

export type VetoAction = MatchTeamMapVeto["action"];

/**
 * One step in a veto sequence template.
 * `order` is 1-indexed to match MatchTeamMapVeto.veto_order.
 */
export interface VetoTemplateStep {
  order: number;
  action: VetoAction;
}

/**
 * A code-defined veto template describing the expected pick/ban sequence
 * for a given best-of format and map pool size.
 */
export interface VetoTemplate {
  bestOf: number;
  mapPoolSize: number;
  steps: readonly VetoTemplateStep[];
}
