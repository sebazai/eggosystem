import {
  postTeamManualPlayerApprovalSchema,
  seasonPlayerRankFormSchema
} from "@eggosystem/types";
import { type Request, type Response } from "express";
import * as z from "zod";
import {
  addManuallyApprovedPartialSignupForSeason,
  addSeasonRankForPlayer,
  getRegisteredTeams
} from "../../models/dashboard/registration.models";
import { getActiveSignupSeasonForAppId } from "../../models/season.models";
import { BadRequestError } from "../../utils/errors";
import { UnauthorizedError } from "express-jwt";

export const addManuallyApprovedPlayersController = async (
  req: Request,
  res: Response
) => {
  try {
    const authedUser = req.auth;
    if (!authedUser) {
      throw new UnauthorizedError(
        "credentials_bad_format",
        new Error("Unauthorized")
      );
    }

    const validatedData = postTeamManualPlayerApprovalSchema.parse(req.body);
    const approvedByAccountId = authedUser.account_id;

    const result = await addManuallyApprovedPartialSignupForSeason(
      validatedData,
      approvedByAccountId
    );

    res.status(200).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ errors: error.errors });
      return;
    }
    throw error;
  }
};

export const addManualRankForPlayerController = async (
  req: Request,
  res: Response
) => {
  try {
    const activeSeason = await getActiveSignupSeasonForAppId(730);
    if (!activeSeason) {
      throw new BadRequestError("No signup for any season for app id 730");
    }
    const validatedData = seasonPlayerRankFormSchema.parse(req.body);

    await addSeasonRankForPlayer(validatedData, activeSeason);

    res.status(200).json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ errors: error.errors });
      return;
    }
    throw error;
  }
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
