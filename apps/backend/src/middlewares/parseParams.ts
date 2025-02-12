import { Request, Response, NextFunction } from 'express';
import { ParsedParams } from '../../express';

const parseParams = (req: Request, res: Response, next: NextFunction): void => {
  const parsedParams: ParsedParams = {
    season_id: req.params.season_id !== 'any' ? parseInt(req.params.season_id, 10) : undefined,
    map: req.params.map !== 'any' ? req.params.map : undefined,
    league_id: req.params.league_id !== 'any' ? parseInt(req.params.league_id, 10) : undefined,
    stage: req.params.stage !== 'any' ? parseInt(req.params.stage, 10) : undefined,
    team_id: req.params.team_id !== 'any' ? parseInt(req.params.team_id, 10) : undefined,
    leaderboard: req.params.leaderboard !== 'any' ? req.params.leaderboard : undefined,
  };

  req.parsedParams = parsedParams;

  next();
};

export default parseParams;
