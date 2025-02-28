import { Request, Response } from "express";
import { getTeams } from "../models/team.models";

export const fetchTeams = async (req: Request, res: Response) => {
  const allTeams = await getTeams();
  res.json(allTeams);
};
