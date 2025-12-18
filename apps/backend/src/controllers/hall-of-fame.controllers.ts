import type { Request, Response } from "express";
import type { HallOfFameCategory } from "@eggosystem/types";
import {
  getHallOfFameOrganizations,
  getHallOfFameTeams,
  getHallOfFamePlayers
} from "../models/hall-of-fame.models";

/**
 * Get Hall of Fame data by category
 * Categories: organizations, teams, players
 */
export const getHallOfFameController = async (req: Request, res: Response) => {
  const category = (req.query.category || "players") as HallOfFameCategory;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

  let data;
  switch (category) {
    case "organizations":
      data = await getHallOfFameOrganizations(limit);
      break;
    case "teams":
      data = await getHallOfFameTeams(limit);
      break;
    case "players":
    default:
      data = await getHallOfFamePlayers(limit);
      break;
  }

  res.json({
    category,
    data
  });
};
