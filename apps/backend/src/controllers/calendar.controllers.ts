import { type Request, type Response } from "express";
import { getMatchesBySeasonAndLeagueWithStreamUrls } from "../models/match.models";
import { getActiveSeason } from "../models/season.models";
import { type RequestWithParamsAndQuery } from "@eggosystem/types";

export const getMatchesBySeasonAndLeagueController = async (
  req: Request,
  res: Response
) => {
  const { season_id, league_id } = req.params;
  const seasonId = Number(season_id);
  const leagueId = league_id === "all" ? null : Number(league_id);
  const matches = await getMatchesBySeasonAndLeagueWithStreamUrls(
    seasonId,
    leagueId
  );
  res.json(matches);
};

/**
 * Get calendar matches by organizer_id and app_id (game)
 * This is used for embeddable calendars that don't know the season_id
 * It automatically finds the active/latest season for the given organizer and game
 */
export const getMatchesByOrganizerAndAppController = async (
  req: RequestWithParamsAndQuery<
    { organizer_id: string; app_id: string },
    { league_id?: string; gametype?: string }
  >,
  res: Response
): Promise<void> => {
  const { organizer_id, app_id } = req.params;
  const { league_id, gametype } = req.query;

  const organizerId = Number(organizer_id);
  const appId = Number(app_id);

  if (isNaN(organizerId) || isNaN(appId) || organizerId <= 0 || appId <= 0) {
    res.status(400).json({
      error:
        "Invalid parameters: organizer_id and app_id must be positive numbers"
    });
    return;
  }

  const season = await getActiveSeason(organizerId, appId, gametype);

  if (!season) {
    res.status(404).json({
      error: `No active season found for organizer ${organizerId} and app ${appId}`
    });
    return;
  }

  const leagueId = league_id && league_id !== "all" ? Number(league_id) : null;

  const matches = await getMatchesBySeasonAndLeagueWithStreamUrls(
    season.season_id,
    leagueId
  );

  res.json(matches);
};
