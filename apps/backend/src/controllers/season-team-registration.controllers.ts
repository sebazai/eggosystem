import {
  type RequestWithParamsAndBody,
  signupFormSchema,
  type SignupFormValues,
  type RequestWithParams
} from "@eggosystem/types";
import type { Response } from "express";
import {
  addSignupForSeason,
  getSeasonTeamRegistrationBySeasonAndTeamId,
  getTeamSignupData,
  updatePlayersForSeasonTeamRegistration,
  updateSeasonTeamRegistration
} from "../models/season-team-registration.models";
import z from "zod";
import { getConnection } from "../db/mysqlConnection";
import {
  getValidSeason,
  checkExternalId,
  ensurePlayerSteamProfilesPublic,
  updateCaptainPermissionsForSeasonTeam
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
  await ensurePlayerSteamProfilesPublic(formData.players);

  const teamIdNum = Number(teamId);
  const connection = await getConnection();
  try {
    await connection.beginTransaction();

    const captainSteamId = formData.players.find((p) => p.captain)?.steamId;
    const coCaptainSteamId = formData.players.find((p) => p.coCaptain)?.steamId;

    if (!captainSteamId || !coCaptainSteamId) {
      throw new Error("Could not determine captain and co-captain.");
    }

    const oldRegistration = await getSeasonTeamRegistrationBySeasonAndTeamId(
      season.id,
      teamIdNum
    );

    const oldCaptain = oldRegistration.captain_steam_id;
    const oldCoCaptain = oldRegistration.co_captain_steam_id;

    await Promise.all([
      updateSeasonTeamRegistration(
        season.id,
        teamIdNum,
        {
          captain_steam_id: captainSteamId,
          co_captain_steam_id: coCaptainSteamId,
          external_platform_id: formData.teamExternalId ?? null
        },
        connection
      ),

      updatePlayersForSeasonTeamRegistration(
        season.id,
        teamIdNum,
        formData.players,
        connection
      ),

      updateCaptainPermissionsForSeasonTeam(
        season.id,
        teamIdNum,
        captainSteamId,
        oldCaptain,
        coCaptainSteamId,
        oldCoCaptain,
        connection
      )
    ]);

    await connection.commit();
    res.status(200).json({
      team_id: teamIdNum,
      organization_id: formData.organizationId
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const addSignupForSeasonController = async (
  req: RequestWithParamsAndBody<{ id: string }, SignupFormValues>,
  res: Response
) => {
  const id = Number(req.params.id);
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
