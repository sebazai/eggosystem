import {
  isNonNullable,
  postTeamManualPlayerApprovalSchema,
  seasonPlayerRankFormSchema
} from "@eggosystem/types";
import { type NextFunction, type Request, type Response } from "express";
import {
  addManuallyApprovedPartialSignupForSeason,
  addSeasonRankForPlayer,
  getRegisteredTeams,
  getPlayerFullName,
  bulkApproveTeamRegistrations,
  manualValidityCheck
} from "../../models/dashboard/registration.models";
import { getActiveSignupOrActiveSeasonForAppId } from "../../models/season.models";
import { BadRequestError, NotFoundError } from "../../utils/errors";
import { type RequestWithParams } from "@eggosystem/types";
import { redisClient } from "../../utils/redisClient";
import { isRegistrationDraftRaw } from "@eggosystem/types";
import { getTeamsSignupApprovalState } from "../../services/dashboard/registration.services";

export const addManuallyApprovedPlayersController = async (
  req: Request,
  res: Response
) => {
  const authedUser = req.auth;
  if (!authedUser) {
    res.sendStatus(401);
    return;
  }

  const validatedData = postTeamManualPlayerApprovalSchema.parse(req.body);
  const approvedByAccountId = authedUser.account_id;

  const result = await addManuallyApprovedPartialSignupForSeason(
    validatedData,
    approvedByAccountId
  );

  res.status(200).json(result);
};

export const addManualRankForPlayerController = async (
  req: Request,
  res: Response
) => {
  // TODO: Make this dynamic
  const activeSeason = await getActiveSignupOrActiveSeasonForAppId(1, 730);
  if (!activeSeason) {
    throw new BadRequestError("No signup for any season for app id 730");
  }
  const validatedData = seasonPlayerRankFormSchema.parse(req.body);

  await addSeasonRankForPlayer(validatedData, activeSeason);

  res.status(200).json({ ok: true });
};

export const getRegisteredTeamsController = async (
  req: Request,
  res: Response
) => {
  // TODO: Make this dynamic
  const activeSeason = await getActiveSignupOrActiveSeasonForAppId(1, 730);
  if (!activeSeason) {
    throw new BadRequestError("No signup for any season for app id 730");
  }
  const teams = await getRegisteredTeams(activeSeason.season_id);
  const flaggedTeams = await getTeamsSignupApprovalState(teams);

  if (teams.length !== flaggedTeams.length) {
    throw new BadRequestError("Teams and flagged teams have different lengths");
  }

  const teamsWithApprovalState = teams.map((team, index) => ({
    ...team,
    is_valid: flaggedTeams[index].is_valid,
    invalid_players: flaggedTeams[index].invalid_players
  }));

  res.status(200).json(teamsWithApprovalState);
};

export const getPlayerFullNameController = async (
  req: RequestWithParams<{ steamId: string }>,
  res: Response,
  next: NextFunction
) => {
  const steamId = req.params.steamId;
  const playerFullName = await getPlayerFullName(steamId);

  if (!playerFullName) {
    return next(new NotFoundError("Player not found"));
  }

  res.status(200).json(playerFullName);
};

export const getAllRegistrationDraftsController = async (
  req: Request,
  res: Response
) => {
  const keys = await redisClient.keys("signup-*");
  if (!keys.length) {
    res.status(200).json([]);
    return;
  }
  const draftsRaw = await redisClient.mget(...keys);
  const drafts = draftsRaw
    .map((val) => {
      if (!val) return null;
      try {
        const parsed = JSON.parse(val);
        return isRegistrationDraftRaw(parsed) ? parsed : null;
      } catch (_e) {
        return null;
      }
    })
    .filter(isNonNullable);
  res.status(200).json(drafts);
};

export const bulkApproveTeamRegistrationsController = async (
  req: Request,
  res: Response
) => {
  const authedUser = req.auth;
  if (!authedUser) {
    res.sendStatus(401);
    return;
  }

  const { teamIds } = req.body;

  if (!Array.isArray(teamIds) || teamIds.length === 0) {
    res
      .status(400)
      .json({ message: "teamIds array is required and must not be empty" });
    return;
  }

  // TODO: Make this dynamic
  const activeSeason = await getActiveSignupOrActiveSeasonForAppId(1, 730);
  if (!activeSeason) {
    throw new BadRequestError("No signup for any season for app id 730");
  }

  const result = await bulkApproveTeamRegistrations(
    activeSeason.season_id,
    teamIds,
    authedUser.account_id
  );

  res.status(200).json(result);
};

export const manualValidityCheckController = async (
  req: Request,
  res: Response
) => {
  const { teamIds } = req.body;
  const authedUser = req.auth;
  if (!authedUser) {
    res.sendStatus(401);
    return;
  }

  if (!Array.isArray(teamIds) || teamIds.length === 0) {
    res
      .status(400)
      .json({ message: "teamIds array is required and must not be empty" });
    return;
  }

  // TODO: Make this dynamic
  const activeSeason = await getActiveSignupOrActiveSeasonForAppId(1, 730);
  if (!activeSeason) {
    throw new BadRequestError("No signup for any season for app id 730");
  }

  const result = await manualValidityCheck(
    activeSeason.season_id,
    teamIds,
    authedUser.account_id
  );
  res.status(200).json(result);
};
