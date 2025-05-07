import {
  type RequestWithParamsAndBody,
  signupFormSchema,
  type SignupFormValues,
  type RequestWithParams
} from "@eggosystem/types";
import type { Response } from "express";
import {
  addSignupForSeason,
  getTeamSignupData,
  updateSignupForSeason
} from "../models/season-team-registration.models";
import z from "zod";
import {
  getValidSeason,
  checkExternalId
} from "../services/season-team-registration.services";
import { isPlayerApprovedForSeasonTeamManually } from "../models/season-team-players.models";

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
  req: RequestWithParams<{
    season_id: string;
    team_id: string;
    steam_id: string;
  }>,
  res: Response
) => {
  const season_id = Number(req.params.season_id);
  const team_id = Number(req.params.team_id);
  const steam_id = req.params.steam_id;

  const approvedManually = await isPlayerApprovedForSeasonTeamManually(
    season_id,
    team_id,
    steam_id
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

  try {
    signupFormSchema({ platform: season.platform }).parse(formData);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: "Invalid signup form data",
        errors: error.flatten()
      });
      return;
    }
    throw error;
  }

  await checkExternalId(season.platform, formData.teamExternalId);

  const teamIdNum = Number(teamId);

  const result = await updateSignupForSeason(season, teamIdNum, formData);
  res.json(result);
};

export const addSignupForSeasonController = async (
  req: RequestWithParamsAndBody<{ season_id: string }, SignupFormValues>,
  res: Response
) => {
  const id = Number(req.params.season_id);
  // Ensure season exists, otherwise throw error

  const season = await getValidSeason(id);
  const formData = req.body;

  try {
    signupFormSchema({ platform: season.platform }).parse(formData);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: "Invalid signup form data",
        errors: error.flatten()
      });
      return;
    }
    throw error;
  }

  await checkExternalId(season.platform, formData.teamExternalId);

  const result = await addSignupForSeason(season, formData);
  res.json(result);
};
