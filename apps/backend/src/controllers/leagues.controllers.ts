import { type Request, type Response } from "express";
import { getLeagues, getLeaguesBySeason } from "../models/league.models";
import type { RequestWithParams } from "@eggosystem/types";

export const getAllLeagues = async (req: Request, res: Response) => {
  const allLeagues = await getLeagues();
  res.json(allLeagues);
};

export const getLeaguesBySeasonController = async (
  req: RequestWithParams<{ season_id: string }>,
  res: Response
) => {
  const seasonIdNumber = Number(req.params.season_id);
  const leagues = await getLeaguesBySeason(seasonIdNumber);
  res.json(leagues);
};
