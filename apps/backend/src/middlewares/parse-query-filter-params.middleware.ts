import { type Request, type Response, type NextFunction } from "express";
import type { ParsedParams } from "@eggosystem/types";

/**
 * Middleware to parse query parameters.
 * - Supports array-style queries (`season_ids=11&season_ids=14`).
 * - Supports comma-separated queries (`season_ids=11,14`).
 * - Converts numeric values to numbers.
 * - Sets `"any"` to `null`.
 * - Ensures `null` for missing required params.
 * - Leaves optional params as `undefined`.
 */
const parseQueryFilterParams = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const parseArray = (
    param: string | string[] | undefined
  ): number[] | null => {
    if (param === undefined || param === "") return null; // Treat empty string as null
    if (param === "any") return null; // Treat "any" as null

    let values: string[] = [];

    if (Array.isArray(param)) {
      values = param;
    } else if (typeof param === "string") {
      values = param.split(",");
    }

    const parsedValues = values
      .map((value) => {
        if (value.trim() === "") return null; // Handle empty values
        const num = Number(value.trim());
        return isNaN(num) ? null : num;
      })
      .filter((n): n is number => n !== null)
      .sort((a, b) => a - b);

    return parsedValues.length > 0 ? parsedValues : null;
  };

  // Parse a single number (for non-array numeric parameters)
  const parseNumber = (param: string | string[] | undefined): number | null => {
    if (param === undefined || param === "") return null;
    if (param === "any") return null;

    const value = Array.isArray(param) ? param[0] : param;
    if (!value) return null;

    const num = Number(value.trim());
    return isNaN(num) ? null : num;
  };

  const parsedParams = {
    season_ids: parseArray(req.query.season_ids?.toString()),
    league_ids: parseArray(req.query.league_ids?.toString()),
    team_ids: parseArray(req.query.team_ids?.toString()),
    stages: parseArray(req.query.stages?.toString()),
    map_ids: parseArray(req.query.map_ids?.toString()),
    player_name: req.query.player_name?.toString() || null,
    // New filter parameters
    faceit_level: parseNumber(req.query.faceit_level?.toString()),
    cs2_rank_min: parseNumber(req.query.cs2_rank_min?.toString()),
    cs2_rank_max: parseNumber(req.query.cs2_rank_max?.toString()),
    tier: parseNumber(req.query.tier?.toString())
  } satisfies ParsedParams;

  req.parsedParams = parsedParams;
  next();
};

export default parseQueryFilterParams;
