import {
  type RequestWithParamsAndBody,
  signupFormSchema,
  type SignupFormValues,
  type RequestWithParams,
  type RequestWithParamsAndQuery,
  newOrganizationSchema
} from "@eggosystem/types";
import type { Response } from "express";
import {
  addSignupForSeason,
  getTeamSignupData,
  updateSignupForSeason
} from "../models/season-team-registration.models";
import {
  getValidSeason,
  checkExternalId,
  createOrganizationForSignup
} from "../services/season-team-registration.services";
import { isPlayerApprovedForSeasonManually } from "../models/season-team-players.models";
import { BadRequestError } from "../utils/errors";
import { redisClient } from "../utils/redisClient";
import { logger } from "../utils/app-logger";
import type { z } from "zod";

// Unwrap the optional wrapper from newOrganizationSchema to make it required for this endpoint
const createOrganizationForSignupSchema = newOrganizationSchema.unwrap();

export const getTeamSignupDetails = async (
  req: RequestWithParams<{ season_id: string; team_id: string }>,
  res: Response
) => {
  const seasonId = Number(req.params.season_id);
  const teamId = Number(req.params.team_id);
  const seasonTeamRegistrationData = await getTeamSignupData(seasonId, teamId);
  res.json(seasonTeamRegistrationData);
};

export const getPlayerApprovedByOrganizer = async (
  req: RequestWithParamsAndQuery<
    {
      season_id: string;
      steam_id: string;
    },
    { team_id?: string; organization_id?: string }
  >,
  res: Response
) => {
  const season_id = Number(req.params.season_id);
  const steam_id = req.params.steam_id;
  const team_id = req.query.team_id ? Number(req.query.team_id) : undefined;
  const organization_id = req.query.organization_id
    ? Number(req.query.organization_id)
    : undefined;

  if (!team_id && !organization_id) {
    throw new BadRequestError(
      "Either team_id or organization_id is required as query param"
    );
  }

  const approvedManually = await isPlayerApprovedForSeasonManually(
    season_id,
    steam_id,
    team_id,
    organization_id
  );
  res.json(approvedManually);
};

export const updateTeamSignupDetails = async (
  req: RequestWithParamsAndBody<
    { season_id: string; team_id: string },
    SignupFormValues
  >,
  res: Response
) => {
  const seasonId = Number(req.params.season_id);
  const teamId = Number(req.params.team_id);
  const season = await getValidSeason(seasonId);
  const formData = req.body;

  signupFormSchema({
    platform: season.platform,
    minPlayers: season.min_players,
    maxPlayers: season.max_players
  }).parse(formData);

  await checkExternalId(season.platform, formData.teamExternalId);

  const teamIdNum = Number(teamId);

  await updateSignupForSeason(season, teamIdNum, formData);
  // These should not change on an update.
  res.json({ team_id: teamIdNum, organization_id: formData.organizationId });
};

export const addSignupForSeasonController = async (
  req: RequestWithParamsAndBody<{ season_id: string }, SignupFormValues>,
  res: Response
) => {
  const id = Number(req.params.season_id);
  // Ensure season exists, otherwise throw error

  const season = await getValidSeason(id);
  const formData = req.body;

  signupFormSchema({
    platform: season.platform,
    minPlayers: season.min_players,
    maxPlayers: season.max_players
  }).parse(formData);

  await checkExternalId(season.platform, formData.teamExternalId);

  const result = await addSignupForSeason(season, formData);
  try {
    if (req.auth?.provider_id) {
      await redisClient.del(`signup-${req.auth.provider_id}`);
    }
  } catch (error) {
    logger.error("Error deleting Redis cache", error);
  }
  res.json(result);
};

export const createOrganizationForSignupController = async (
  req: RequestWithParamsAndBody<
    { season_id: string },
    z.infer<typeof createOrganizationForSignupSchema>
  >,
  res: Response
) => {
  const seasonId = Number(req.params.season_id);
  await getValidSeason(seasonId);

  const validatedData = createOrganizationForSignupSchema.parse(req.body);

  const result = await createOrganizationForSignup(validatedData);

  res.json({ organizationId: result.insertId });
};
