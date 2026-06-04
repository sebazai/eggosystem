import type { PlayerSeasonContextQuery } from "@eggosystem/types";

/** Kanaliiga CS2 comp — align with FilterProvider appId until multi-org (#220). */
export const DEFAULT_PLAYER_SEASON_CONTEXT = {
  organizer_id: 1,
  app_id: 730,
  gametype: "comp"
} satisfies PlayerSeasonContextQuery;

export function buildPlayerSeasonsContextSearchParams(
  context: PlayerSeasonContextQuery
): string {
  const params = new URLSearchParams();
  params.set("organizer_id", String(context.organizer_id));
  params.set("app_id", String(context.app_id));
  params.set("gametype", context.gametype);
  return params.toString();
}
