import type { Response, NextFunction } from "express";
import type { RequestWithParams } from "@eggosystem/types";
import { getTeamHistoricalPerformance } from "../../models/dashboard/sortter-history.models";

/**
 * Controller to get historical performance for a team
 * Finds previous seasons where 4+ of the team's registered players played together
 * and returns their win/loss record and average round scores
 */
export const getTeamHistoryController = async (
  req: RequestWithParams<{ season_id: string; team_id: string }>,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  const seasonId = Number(req.params.season_id);
  const teamId = Number(req.params.team_id);

  const history = await getTeamHistoricalPerformance(seasonId, teamId);

  res.json(history);
};
