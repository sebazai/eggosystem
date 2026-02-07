import {
  type GameRanks,
  type LeetifyResponse,
  type MatchmakingRankType,
  type CS2LeetifyAvgRank
} from "@eggosystem/types";
import { logger } from "../utils/app-logger";
import { createAbortController } from "../utils/fetch-utils";
import {
  getRateLimitForService,
  setRateLimitForService
} from "../utils/rate-limit-utils";
import { isValidRank } from "./player-ranks.services";

const isMatchmakingRank = (game: GameRanks): game is MatchmakingRankType =>
  game.dataSource === "matchmaking";

const getAverageRankForGames = (games: GameRanks[]) => {
  const now = new Date();
  const oneAndHalfYearAgo = new Date();
  oneAndHalfYearAgo.setFullYear(oneAndHalfYearAgo.getFullYear() - 1);
  oneAndHalfYearAgo.setMonth(oneAndHalfYearAgo.getMonth() - 6);

  const timeWindowMs = now.getTime() - oneAndHalfYearAgo.getTime();

  const gamesWithinOneAndAHalfYear = games
    .filter(
      (g): g is MatchmakingRankType =>
        isMatchmakingRank(g) &&
        g.rankType === 11 &&
        g.isCs2 &&
        g.skillLevel > 0 &&
        new Date(g.gameFinishedAt) >= oneAndHalfYearAgo
    )
    .sort(
      (a, b) =>
        new Date(b.gameFinishedAt).getTime() -
        new Date(a.gameFinishedAt).getTime()
    ); // Sort by gameFinishedAt descending

  if (gamesWithinOneAndAHalfYear.length > 0) {
    let weightedSum = 0;
    let totalWeight = 0;

    for (const game of gamesWithinOneAndAHalfYear) {
      const ageMs = now.getTime() - new Date(game.gameFinishedAt).getTime();
      // Quadratic decay: weight 1.0 for today, drops off aggressively for older games
      const linearWeight = (timeWindowMs - ageMs) / timeWindowMs;
      const weight = linearWeight * linearWeight;
      weightedSum += game.skillLevel * weight;
      totalWeight += weight;
    }

    const weightedAverage = weightedSum / totalWeight;
    const roundedRank = Math.round(weightedAverage);
    if (!isValidRank(roundedRank)) {
      return undefined;
    }

    return {
      average_rank: roundedRank,
      rank_updated_at: gamesWithinOneAndAHalfYear[0].gameFinishedAt // Latest game
    } satisfies CS2LeetifyAvgRank;
  }

  return undefined; // No games found within the last 1.5 years
};

export const getCS2RankFromLeetify = async (steam_id: string) => {
  const rateLimit = await getRateLimitForService("Leetify");
  if (rateLimit) {
    return undefined;
  }

  const webURL = `https://api.cs-prod.leetify.com/api/profile/id/${steam_id}`;

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
      if (result.status === 429) {
        await setRateLimitForService(
          "Leetify",
          result.headers.get("Retry-After"),
          result.headers.get("X-RateLimit-Reset")
        );
      } else {
        logger.warn(
          `[Leetify] API returned ${result.status} ${result.statusText} for steam_id: ${steam_id} (${duration}ms)`
        );
      }

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
