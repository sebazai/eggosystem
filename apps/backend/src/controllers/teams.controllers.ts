import { type Request, type Response } from "express";
import { getTeams } from "../models/team.models";

export const getAllTeams = async (req: Request, res: Response) => {
  const allTeams = await getTeams();
  res.json(allTeams);
};
