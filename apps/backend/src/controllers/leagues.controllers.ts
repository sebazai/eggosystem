import { Request, Response } from "express";
import { getLeagues } from "../models/league.models";

export const fetchLeagues = async (req: Request, res: Response) => {
  const allLeagues = await getLeagues();
  res.json(allLeagues);
};
