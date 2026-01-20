import { runQuery } from "../db/mysqlRunQuery";
import type { Game, GameType } from "@eggosystem/types";
import { NotFoundError } from "../utils/errors";

export const getGames = async (): Promise<Game[]> => {
  return runQuery<Game[]>("SELECT * FROM Games ORDER BY name");
};

export const getGameById = async (id: number): Promise<Game | undefined> => {
  const [game] = await runQuery<[Game | undefined]>(
    "SELECT * FROM Games WHERE id = ?",
    [id]
  );
  return game;
};

export const getGameByIdOrFail = async (id: number): Promise<Game> => {
  const game = await getGameById(id);
  if (!game) {
    throw new NotFoundError(`Video game with id ${id} not found`);
  }
  return game;
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

/**
 * Gets the game type ID by name. If the game type is not found, returns 1 (comp).
 * @param name - The name of the game type
 * @returns The game type ID
 */
export const getGameTypeIdByName = async (name?: string): Promise<number> => {
  if (!name) {
    return 1;
  }
  const [gameType] = await runQuery<Array<{ id: number } | undefined>>(
    "SELECT id FROM GameTypes WHERE LOWER(name) = LOWER(?) LIMIT 1",
    [name]
  );
  return gameType?.id ?? 1;
};
