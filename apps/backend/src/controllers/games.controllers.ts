import { type Response, type Request } from "express";
import {
  getGames,
  getGameTypes,
  getGameTypesByGameId
} from "../models/game.models";

export const getGamesController = async (req: Request, res: Response) => {
  const games = await getGames();
  res.json(games);
};

export const getGameTypesController = async (req: Request, res: Response) => {
  const gameTypes = await getGameTypes();
  res.json(gameTypes);
};

export const getGameTypesByGameIdController = async (
  req: { params: { gameId: string } },
  res: Response
) => {
  const gameId = parseInt(req.params.gameId, 10);
  const gameTypes = await getGameTypesByGameId(gameId);
  res.json(gameTypes);
};
