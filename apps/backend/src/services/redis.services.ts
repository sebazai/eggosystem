import type { Game } from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";
import { redisClient } from "../utils/redisClient";

const redisKeysToClear = ["hours", "rank", "faceit-cs2-rank"];

export const clearPossibleRedisCacheForNewUser = async (steamId: string) => {
  const games = await runQuery<Game[]>("SELECT * FROM Games");
  for (const game of games) {
    for (const key of redisKeysToClear) {
      await redisClient.del(`${game.steam_app_id}-${steamId}-${key}`);
    }
  }
};
