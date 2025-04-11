import { type Request, type Response, type NextFunction } from "express";
import type { ParsedParams } from "@eggosystem/types";

/**
 * Middleware to parse query parameters.
 * - Supports array-style queries (`season_ids[]=11&season_ids[]=14`).
 * - Supports comma-separated queries (`season_ids=11,14`).
 * - Converts numeric values to numbers.
 * - Sets `"any"` to `null`.
 * - Ensures `null` for missing required params.
 * - Leaves optional params as `undefined`.
 */
const parseQueryParams = (
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
      .filter((n): n is number => n !== null);

    return parsedValues.length > 0 ? parsedValues : null;
  };

  const parsedParams: ParsedParams = {
    season_ids: parseArray(req.query.season_ids?.toString()),
    league_ids: parseArray(req.query.league_ids?.toString()),
    team_ids: parseArray(req.query.team_ids?.toString()),
    stages: parseArray(req.query.stages?.toString()),
    map_ids: parseArray(req.query.map_ids?.toString()),
    leaderboard:
      req.params.leaderboard === "any" ? null : req.params.leaderboard
  };

  req.parsedParams = parsedParams;
  next();
};

export default parseQueryParams;
