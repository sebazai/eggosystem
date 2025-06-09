import { type Request, type Response } from "express";
import { stabilizePlayerElo } from "../services/elo.services";
import { BadRequestError } from "../utils/errors";

interface StabilizeEloRequest {
  steam_id: string;
  offered_elo: number;
}

export const stabilizeEloController = async (
  req: Request<Record<string, never>, unknown, StabilizeEloRequest>,
  res: Response
): Promise<void> => {
  const { steam_id, offered_elo } = req.body;

  // Validate input
  if (!steam_id) {
    throw new BadRequestError("steam_id is required");
  }

  if (offered_elo === undefined || offered_elo === null) {
    throw new BadRequestError("offered_elo is required");
  }

  if (typeof offered_elo !== "number" || offered_elo <= 0) {
    throw new BadRequestError("offered_elo must be a positive number");
  }

  // Validate Steam ID format (basic validation)
  if (!/^\d{17}$/.test(steam_id)) {
    throw new BadRequestError("steam_id must be a valid 17-digit Steam ID");
  }

  const result = await stabilizePlayerElo(steam_id, offered_elo);

  res.status(200).json(result);
};
