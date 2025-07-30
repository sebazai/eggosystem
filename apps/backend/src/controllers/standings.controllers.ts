import { type Request, type Response } from "express";
import { getDivStandings } from "../services/standings.services";
import { BadRequestError } from "../utils/errors";
import { logger } from "../utils/app-logger";

interface StandingsParams {
  league_id: string;
}

export const getStandingsController = async (
  req: Request<StandingsParams>,
  res: Response
): Promise<void> => {
  try {
    const { league_id } = req.params;

    if (!league_id) {
      throw new BadRequestError("League ID is required");
    }

    logger.info(`Fetching standings for league: ${league_id}`);

    const standings = await getDivStandings(league_id);

    res.json({
      data: standings,
      status: 200
    });
  } catch (error) {
    logger.error("Error in getStandingsController:", error);

    if (error instanceof BadRequestError) {
      res.status(400).json({
        error: error.message,
        status: 400
      });
      return;
    }

    res.status(500).json({
      error: "Internal server error",
      status: 500
    });
  }
};
