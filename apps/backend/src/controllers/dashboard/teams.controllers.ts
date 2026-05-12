import { type Response, type NextFunction } from "express";
import type { RequestWithParams } from "@eggosystem/types";
import { getTeamOrganization } from "../../models/dashboard/team.models";
import { getTeamPlayerValuesLive } from "../../models/dashboard/sortter.models";
import { NotFoundError } from "../../utils/errors";

export const getTeamOrganizationController = async (
  req: RequestWithParams<{ id: string }>,
  res: Response
) => {
  const teamId = Number(req.params.id);
  const organization = await getTeamOrganization(teamId);
  res.json(organization);
};

/**
 * Controller to get live team player data from SeasonTeamPlayers table
 * This shows current players including those added after sortter finalization
 * Used by substitute player page to show team roster and select replacement player
 */
export const getTeamPlayersController = async (
  req: RequestWithParams<{ season_id: string; team_id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const seasonId = Number(req.params.season_id);
  const teamId = Number(req.params.team_id);

  const playerValues = await getTeamPlayerValuesLive(seasonId, teamId);

  if (playerValues.length === 0) {
    return next(
      new NotFoundError(
        `No players found for team ${teamId} in season ${seasonId}`
      )
    );
  }

  // Convert null values to 0 for the response
  const formattedPlayerValues = playerValues.map((player) => ({
    name: player.name,
    steamid: player.steamid,
    cs2_rank: player.cs2_rank ?? 0,
    faceit_level: player.faceit_level ?? 0,
    faceit_elo: player.faceit_elo ?? 0,
    hours: player.hours ?? 0,
    kanarating: player.kanarating ?? 0,
    fkd: player.fkd ?? 0,
    kana_elo: player.kana_elo ?? 0,
    calculus: player.calculus ?? null,
    role: player.role,
    is_captain: player.is_captain,
    is_co_captain: player.is_co_captain,
    match_id: player.match_id,
    match_info: player.match_info
  }));

  res.json(formattedPlayerValues);
};
