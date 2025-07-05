import { type Response } from "express";
import { stabilizePlayerElo } from "../services/elo.services";
import { BadRequestError } from "../utils/errors";
import { validateSteamId } from "../utils/steam-id-validator";
import { type RequestWithBody } from "@eggosystem/types";

interface StabilizationRequest {
  playerId: string; // Steam ID of the player
  currentValue: number; // Calculated kanaelo value (0-400)
  season: string; // Season ID
  metadata?: {
    timestamp: string; // ISO timestamp
    source: string; // Always "kanaelo-calc"
  };
}

interface StabilizationResponse {
  stabilizedValue: number; // Adjusted kanaelo value (0-400)
  confidence: number; // Confidence level (0.0-1.0)
  adjustmentFactor: number; // Multiplier applied (0.5-2.0 typical range)
  metadata: {
    processed: boolean; // Whether stabilization was applied
    timestamp: string; // ISO timestamp
    method: string; // Stabilization method used
  };
}

export const stabilizeEloController = async (
  req: RequestWithBody<StabilizationRequest>,
  res: Response<StabilizationResponse>
): Promise<void> => {
  const { playerId, currentValue, season, metadata: _metadata } = req.body;

  // Validate input
  if (!playerId) {
    throw new BadRequestError("playerId is required");
  }

  if (currentValue === undefined || currentValue === null) {
    throw new BadRequestError("currentValue is required");
  }

  if (
    typeof currentValue !== "number" ||
    currentValue < 0 ||
    currentValue > 400
  ) {
    throw new BadRequestError(
      "currentValue must be a number between 0 and 400"
    );
  }

  if (!season) {
    throw new BadRequestError("season is required");
  }

  // Validate Steam ID format using the utility function
  validateSteamId(playerId, "playerId must be a valid 17-digit Steam ID");

  const result = await stabilizePlayerElo(playerId, currentValue, season);

  res.status(200).json(result);
};
