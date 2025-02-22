import { Request, Response, NextFunction } from "express";
import type { ParsedParams } from "@eggosystem/types";

const parseParams = (req: Request, res: Response, next: NextFunction): void => {
  const parsedParams: ParsedParams = {
    season_id:
      req.params.season_id !== "any"
        ? parseInt(req.params.season_id, 10)
        : null,
    league_id:
      req.params.league_id !== "any"
        ? parseInt(req.params.league_id, 10)
        : null,
    team_id:
      req.params.team_id !== "any" ? parseInt(req.params.team_id, 10) : null,
    stage: req.params.stage !== "any" ? parseInt(req.params.stage, 10) : null,
    map_id:
      req.params.map_id !== "any" ? parseInt(req.params.map_id, 10) : null,
    leaderboard:
      req.params.leaderboard !== "any" ? req.params.leaderboard : null,
  };

  req.parsedParams = parsedParams;
  console.log(req.parsedParams);

  next();
};

export default parseParams;
