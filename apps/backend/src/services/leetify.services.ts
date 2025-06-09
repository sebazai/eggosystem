import { type CS2LeetifyAvgRank, type Nullable } from "@eggosystem/types";
import { logger } from "../utils/app-logger";
import { createAbortController } from "../utils/fetch-utils";

const LEETIFY_BASE_URL = "https://api.cs-prod.leetify.com/api/profile/id/";

const isMatchmakingRank = (game: GameRanks): game is MatchmakingRankType =>
  game.dataSource === "matchmaking";

const getAverageRankForGames = (games: GameRanks[]) => {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const gamesWithinOneYear = games
    .filter(
      (g): g is MatchmakingRankType =>
        isMatchmakingRank(g) &&
        g.rankType === 11 &&
        g.isCs2 &&
        g.skillLevel > 0 &&
        new Date(g.gameFinishedAt) >= oneYearAgo
    )
    .sort(
      (a, b) =>
        new Date(b.gameFinishedAt).getTime() -
        new Date(a.gameFinishedAt).getTime()
    ); // Sort by gameFinishedAt descending

  if (gamesWithinOneYear.length > 0) {
    const totalSkillLevel = gamesWithinOneYear.reduce(
      (sum, g) => sum + g.skillLevel,
      0
    );
    const averageSkillLevel = totalSkillLevel / gamesWithinOneYear.length;

    return {
      average_rank: Math.round(averageSkillLevel),
      rank_updated_at: gamesWithinOneYear[0].gameFinishedAt // Latest game
    } satisfies CS2LeetifyAvgRank;
  }

  return undefined; // No games found within the last year
};

// Ranktypes
// 11 = premier
// 12 = map based comp

interface MatchmakingRankType {
  dataSource: "matchmaking";
  rankType: Nullable<number>;
  skillLevel: number;
  isCs2: boolean;
  gameFinishedAt: string;
}

interface FaceITRankType {
  dataSource: "faceit";
  rankType: null;
  skillLevel: null;
  elo: number;
  isCs2: boolean;
  gameFinishedAt: string;
}

type GameRanks = MatchmakingRankType | FaceITRankType;

export interface LeetifyResponse {
  games: Array<GameRanks>;
}

export const getCS2RankFromLeetify = async (steam_id: string) => {
  const webURL = `${LEETIFY_BASE_URL}${steam_id}`;

  const { controller, clearAbortTimeout } = createAbortController(
    "getCS2RankFromLeetify"
  );

  try {
    const result = await fetch(webURL, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Kanaliiga-Eggosystem/1.0"
      }
    });

    if (!result.ok) {
      const duration = clearAbortTimeout();
      logger.warn(
        `[Leetify] API returned ${result.status} ${result.statusText} for steam_id: ${steam_id} (${duration}ms)`
      );
      return undefined;
    }

    const data: LeetifyResponse = await result.json();
    const cs2GamesAvgRank = getAverageRankForGames(data.games);

    clearAbortTimeout();
    return cs2GamesAvgRank;
  } catch (error) {
    const duration = clearAbortTimeout();

    logger.error(
      `[Leetify] Request failed for steam_id: ${steam_id} (${duration}ms):`,
      error
    );

    return undefined;
  }
};
