import { runQuery } from "../db/mysqlRunQuery";
import type { Game, GameType } from "@eggosystem/types";

export const getGames = async (): Promise<Game[]> => {
  return runQuery<Game[]>("SELECT * FROM Games ORDER BY name");
};

export const getGameTypes = async (): Promise<GameType[]> => {
  return runQuery<GameType[]>(
    "SELECT gt.*, CONCAT(g.abbreviation, ' ', gt.name) as name FROM GameTypes gt JOIN Games g ON gt.game_id = g.id ORDER BY g.name, gt.name"
  );
};

export const getGameTypesByGameId = async (
  gameId: number
): Promise<GameType[]> => {
  return runQuery<GameType[]>(
    "SELECT gt.*, CONCAT(g.abbreviation, ' ', gt.name) as name FROM GameTypes gt JOIN Games g ON gt.game_id = g.id WHERE gt.game_id = ? ORDER BY gt.name",
    [gameId]
  );
};
