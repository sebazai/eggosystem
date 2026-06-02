import {
  type KanaLeaderboardEntry,
  type KanaLeaderboardResponse,
  type KanaTier
} from "@eggosystem/types";
import { getTopLiveKanaEloPlayers } from "../models/steam-player-kana-elo.models";
import { getPlayerThreshold, TOP_COCK_COUNT } from "./player-ranks.services";

// Number of players tracked in the leaderboard (global top 50).
const LEADERBOARD_SIZE = 50;

/**
 * Build the Steam community profile URL for a player.
 */
const buildProfileUrl = (steam_id: string): string =>
  `https://steamcommunity.com/profiles/${steam_id}`;

/**
 * Classify a single player into a leaderboard entry.
 *
 * Top-10 positions are TOP_COCK; everyone else is classified purely by their
 * kana elo via the shared KANARANK_THRESHOLDS / getPlayerThreshold logic.
 */
const classifyEntry = (
  player: { steam_id: string; nickname: string; kana_elo: number },
  position: number
): KanaLeaderboardEntry => {
  const base = {
    position,
    steam_id: player.steam_id,
    nickname: player.nickname,
    kana_elo: player.kana_elo,
    profile_url: buildProfileUrl(player.steam_id)
  };

  if (position <= TOP_COCK_COUNT) {
    return { ...base, rank: "TOP_COCK", subrank: 1 };
  }

  const threshold = getPlayerThreshold(player.kana_elo);
  return { ...base, rank: threshold.rank, subrank: threshold.subrank };
};

/**
 * Does an entry match the requested tier?
 *
 * - `TOP_COCK` matches only entries classified TOP_COCK (top-10 positions).
 * - A broad grouping (`COCK` | `CHICKEN` | `CHICK` | `EGG`) matches any
 *   sub-rank of that rank. NOTE: a TOP_COCK entry does NOT match the broad
 *   `COCK` grouping — it has rank `TOP_COCK`, not `COCK`.
 * - A sub-rank (`COCK_1` ... `EGG_3`) matches an exact rank + subrank.
 */
const matchesTier = (entry: KanaLeaderboardEntry, tier: KanaTier): boolean => {
  const underscoreIndex = tier.indexOf("_");

  // Sub-rank filter like "COCK_1" (but not "TOP_COCK").
  if (underscoreIndex !== -1 && tier !== "TOP_COCK") {
    const rank = tier.slice(0, underscoreIndex);
    const subrank = Number(tier.slice(underscoreIndex + 1));
    return entry.rank === rank && entry.subrank === subrank;
  }

  // Broad grouping or TOP_COCK: match on rank only.
  return entry.rank === tier;
};

/**
 * Get the kana elo leaderboard.
 *
 * Reads live ratings from SteamPlayerKanaElo (source of truth), takes the
 * global top 50 ordered highest kana elo first, assigns 1-based positions and
 * kana rank tiers, then — when a tier is supplied — filters to that tier.
 * Positions are assigned before filtering, so they are never changed by the
 * tier filter.
 *
 * @param tier Optional tier filter (broad grouping or sub-rank).
 * @returns The (optionally filtered) leaderboard.
 */
export const getKanaLeaderboard = async (
  tier?: KanaTier
): Promise<KanaLeaderboardResponse> => {
  const livePlayers = await getTopLiveKanaEloPlayers(LEADERBOARD_SIZE);

  const entries = livePlayers.map((player, index) =>
    classifyEntry(player, index + 1)
  );

  const players = tier
    ? entries.filter((entry) => matchesTier(entry, tier))
    : entries;

  return {
    tier: tier ?? null,
    players
  };
};
