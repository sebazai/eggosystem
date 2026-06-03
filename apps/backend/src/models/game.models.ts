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

/** Case-insensitive match on `Games.abbreviation` (e.g. `cs2` → CS2). */
export const getGameByAbbreviationCi = async (
  abbrev: string
): Promise<Game | undefined> => {
  const trimmed = abbrev.trim();
  if (!trimmed) {
    return undefined;
  }
  const rows = await runQuery<Game[]>(
    "SELECT * FROM Games WHERE LOWER(abbreviation) = LOWER(?) LIMIT 1",
    [trimmed]
  );
  return rows[0];
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
