import { type Request, type Response } from "express";
import { getMatchesBySeasonAndLeagueWithStreamUrls } from "../models/match.models";

export const getMatchesBySeasonAndLeagueController = async (
  req: Request,
  res: Response
) => {
  const { season_id, league_id } = req.params;
  const seasonId = Number(season_id);
  const leagueId = league_id === "all" ? null : Number(league_id);
  const matches = await getMatchesBySeasonAndLeagueWithStreamUrls(
    seasonId,
    leagueId
  );
  res.json(matches);
};
