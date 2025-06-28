import {
  postTeamManualPlayerApprovalSchema,
  seasonPlayerRankFormSchema
} from "@eggosystem/types";
import { type Request, type Response } from "express";
import {
  addManuallyApprovedPartialSignupForSeason,
  addSeasonRankForPlayer,
  getRegisteredTeams,
  getPlayerFullName
} from "../../models/dashboard/registration.models";
import { getActiveSignupSeasonForAppId } from "../../models/season.models";
import { BadRequestError } from "../../utils/errors";
import { type RequestWithParams } from "@eggosystem/types";

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
  const activeSeason = await getActiveSignupSeasonForAppId(730);
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
  const activeSeason = await getActiveSignupSeasonForAppId(730);
  if (!activeSeason) {
    throw new BadRequestError("No signup for any season for app id 730");
  }
  const teams = await getRegisteredTeams(activeSeason.season_id);
  res.status(200).json(teams);
};

export const getPlayerFullNameController = async (
  req: RequestWithParams<{ steamId: string }>,
  res: Response
) => {
  const steamId = req.params.steamId;
  const playerFullName = await getPlayerFullName(steamId);

  if (!playerFullName) {
    res.status(404).json({ message: "Player not found" });
    return;
  }

  res.status(200).json(playerFullName);
};
