import { type Request, type Response } from "express";
import { getMatchesBySeasonAndLeague } from "../models/match.models";

export const getMatchesBySeasonAndLeagueController = async (
  req: Request,
  res: Response
) => {
  const { season_id, league_id } = req.params;
  const matches = await getMatchesBySeasonAndLeague(
    Number(season_id),
    Number(league_id)
  );
  res.json(matches);
};
