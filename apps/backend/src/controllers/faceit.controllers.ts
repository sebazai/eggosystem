import { type Request, type Response, type NextFunction } from "express";
import {
  getFaceITChampionshipDetails,
  getAllFaceITChampionshipSubscriptions
} from "../services/faceit.services";
import { NotFoundError } from "../utils/errors";
import { getSeasonLeagueExternalIdByExternalId } from "../models/season-league-external-id.models";
import { getSeasonLeagueTeamsBySeasonLeagueExternalId } from "../models/season-league-team.models";
import {
  type TeamWithExternalDataValidated,
  type TeamWithExternalData,
  type ChampionshipDetails
} from "@eggosystem/types";
import { logger } from "../utils/app-logger";
import { triggerManualFaceitSync } from "../services/cron-scheduler.services";

export const validateChampionshipTeamsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const seasonLeagueExternalIdRow = await getSeasonLeagueExternalIdByExternalId(
    req.params.championship_id
  );

  if (!seasonLeagueExternalIdRow) {
    return next(
      new NotFoundError(
        `Season league external id not found with id ${req.params.championship_id}`
      )
    );
  }

  const championshipDetails =
    await getFaceITChampionshipDetails<ChampionshipDetails>(
      req.params.championship_id
    );

  if (!championshipDetails) {
    return next(
      new NotFoundError(
        `Championship not found with id ${req.params.championship_id}`
      )
    );
  }

  const data = await getAllFaceITChampionshipSubscriptions(
    req.params.championship_id
  );
  if (!data) {
    return next(
      new NotFoundError(
        `Championship not found with id ${req.params.championship_id}`
      )
    );
  }

  const subscriptions = data.items;

  const externalTeamIds = subscriptions.map((subscription) => {
    return subscription.team.team_id;
  });
  const seasonId = seasonLeagueExternalIdRow.season_id;
  const leagueId = seasonLeagueExternalIdRow.league_id;

  const teams = await Promise.allSettled(
    externalTeamIds.map(async (externalTeamId) => {
      return getSeasonLeagueTeamsBySeasonLeagueExternalId(
        externalTeamId,
        seasonId,
        leagueId
      );
    })
  );

  const validTeams = teams
    .filter(
      (team): team is PromiseFulfilledResult<TeamWithExternalData> =>
        team.status === "fulfilled" && !!team.value
    )
    .map((team) => team.value);

  const mapSubscriptionKeyToTeamReduce = subscriptions.reduce(
    (acc, subscription) => {
      const team = validTeams.find(
        (team) => team.external_team_id === subscription.team.team_id
      );
      if (team) {
        acc[subscription.team.team_id] = {
          ...team,
          isValid: true
        };
      } else {
        acc[subscription.team.team_id] = {
          external_team_id: subscription.team.team_id,
          name: subscription.team.name,
          isValid: false
        };
      }
      return acc;
    },
    {} as Record<string, TeamWithExternalDataValidated>
  );

  const maximumSlots = championshipDetails.slots;

  res.json({
    teams: mapSubscriptionKeyToTeamReduce,
    maximumSlots
  });
};

/**
 * Controller to manually trigger FACEIT match synchronization
 * This endpoint can be used for testing or manual operations
 */
export const triggerFaceitMatchSync = async (
  req: Request,
  res: Response
): Promise<void> => {
  logger.info("Manual FACEIT match sync triggered via API endpoint");

  // Start the sync process asynchronously
  await triggerManualFaceitSync();

  // Return immediate response to avoid timeout
  res.status(200).json({
    message: "FACEIT match sync initiated successfully",
    note: "The sync process is running in the background. Check server logs for progress and results."
  });
};
