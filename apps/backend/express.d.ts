export interface ParsedParams {
  season_id?: number;
  map?: string;
  league_id?: number;
  stage?: number;
  team_id?: number;
  leaderboard?: string;
}

declare global {
  namespace Express {
    interface Request {
      parsedParams?: ParsedParams; // Add the parsedParams property to the Request type
    }
  }
}
