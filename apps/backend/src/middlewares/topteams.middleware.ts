import type { Request, Response, NextFunction } from "express";

interface TopTeamsQuery {
  league_id: string | number;
  season_id: string | number;
  stage?: string | number;
  map_id?: string | number;
  [key: string]: string | number | undefined;
}

export const validateTopTeamsParams = (
  req: Request<unknown, unknown, unknown, TopTeamsQuery>,
  res: Response,
  next: NextFunction
): void => {
  const { league_id, season_id, stage, map_id } = req.query;

  // Required parameters
  if (!league_id || !season_id) {
    res.status(400).json({
      error: "Missing required parameters: league_id and season_id are required"
    });
    return;
  }

  // Validate types
  if (
    isNaN(Number(league_id)) ||
    isNaN(Number(season_id)) ||
    (stage && isNaN(Number(stage))) ||
    (map_id && isNaN(Number(map_id)))
  ) {
    res.status(400).json({
      error: "Invalid parameter types: parameters must be numbers"
    });
    return;
  }

  next();
};
