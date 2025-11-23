import { type Response } from "express";
import { type RequestWithParams } from "@eggosystem/types";
import { getFantasyPlayersByLeague } from "../models/fantasy.models";

export const getFantasyPlayersByLeagueController = async (
  req: RequestWithParams<{ season_id: string; league_id: string }>,
  res: Response
) => {
  const seasonId = Number(req.params.season_id);
  const leagueId = Number(req.params.league_id);

  const players = await getFantasyPlayersByLeague(seasonId, leagueId);

  res.json(players);
};

