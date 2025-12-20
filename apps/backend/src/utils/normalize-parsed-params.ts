import type { ParsedParams } from "@eggosystem/types";

/**
 * Normalizes a ParsedParams object by sorting keys alphabetically.
 * This ensures consistent JSON stringification for hash generation,
 * regardless of the order parameters were received from the client.
 *
 * Arrays within ParsedParams are already sorted in the parse middleware,
 * so we only need to normalize the object key order.
 *
 * @param params - The ParsedParams object to normalize
 * @returns A new ParsedParams object with keys in alphabetical order
 */
export function normalizeParsedParams(params: ParsedParams): ParsedParams {
  // Create a new object with keys in alphabetical order
  // This ensures consistent JSON.stringify output for hash generation
  return {
    cs2_rank_max: params.cs2_rank_max,
    cs2_rank_min: params.cs2_rank_min,
    faceit_level: params.faceit_level,
    league_ids: params.league_ids,
    map_ids: params.map_ids,
    player_name: params.player_name,
    season_ids: params.season_ids,
    stages: params.stages,
    team_ids: params.team_ids,
    tier: params.tier
  };
}
