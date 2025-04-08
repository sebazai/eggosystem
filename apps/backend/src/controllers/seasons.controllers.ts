import { type Request, type Response } from "express";
import { getSeasons, getSeasonById } from "../models/season.models";
import {
  signupFormSchema,
  UpsertPlayer,
  type RequestWithParamsAndBody,
  type SignupFormValues
} from "@eggosystem/types";
import z from "zod";
import { insertOrganization } from "../models/organization.models";
import { getConnection } from "../db/mysqlConnection";
import { insertTeam } from "../models/team.models";
import { upsertPlayer } from "../models/player.models";
import { signUpTeamForSeason } from "../services/signup.services";
import { isTeamPartOfOrganization } from "../services/team.services";
import {
  areSteamProfilesPublic,
  getFullPlayerDetails
} from "../services/player.services";
import _ from "lodash";

export const fetchSeasons = async (_req: Request, res: Response) => {
  const allSeasons = await getSeasons();
  res.json(allSeasons);
};

export const fetchSeasonById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const [season] = await getSeasonById(id);
  if (!season) {
    res.status(404).json({ message: "Season not found" });
    return;
  }
  res.json(season);
};

export const addSignupForSeason = async (
  req: RequestWithParamsAndBody<{ id: string }, SignupFormValues>,
  res: Response
) => {
  const { id } = req.params;
  // Ensure season exists, otherwise throw error
  const [season] = await getSeasonById(id);
  if (!season) {
    res.status(404).json({ message: "Season not found" });
    return;
  }
  if (!season.signup_start_date) {
    res.status(400).json({
      message: "Season does not have a signup start date"
    });
    return;
  }
  const now = new Date();
  const signupStart = new Date(season.signup_start_date);
  if (now < signupStart) {
    res.status(400).json({
      message: "Signup has not started yet"
    });
    return;
  }
  if (season.signup_end_date) {
    const signupEnd = new Date(season.signup_end_date);
    if (now > signupEnd) {
      res.status(400).json({
        message: "Signup has ended"
      });
      return;
    }
  }

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

  const steamIds = formData.players.map((p) => p.steam_id);
  const areProfilePublic = await areSteamProfilesPublic(steamIds);
  if (!areProfilePublic.is_all_public) {
    throw new Error(
      `Steam IDs ${areProfilePublic.not_public.join(", ")} are not public.`
    );
  }
  const connection = await getConnection();

  try {
    await connection.beginTransaction();
    // Handle adding or updating players
    for (const formDataPlayer of formData.players) {
      const playerExists = await getFullPlayerDetails(formDataPlayer.steam_id);
      const parameters = {
        ...(formDataPlayer.captain || formDataPlayer.co_captain
          ? { discord: formDataPlayer.discord }
          : {})
      };

      if (!_.isEmpty(parameters) || !playerExists)
        await upsertPlayer(
          {
            steam_id: formDataPlayer.steam_id,
            ...(!playerExists
              ? { name: formDataPlayer.name }
              : { name: playerExists.name }),
            ...parameters
          } satisfies UpsertPlayer,
          connection
        );
    }

    const playersForTeamRegistration = formData.players.map((player) => {
      return {
        steam_id: player.steam_id,
        is_captain: player.captain,
        is_co_captain: player.co_captain
      };
    });

    // Handle new org and new team.
    if (formData.organizationId === -1) {
      if (formData.teamId !== -1) {
        res.status(400).json({
          message: "Cannot create a new organization with an existing team"
        });
        return;
      }

      if (formData.newOrganization) {
        const newOrg = await insertOrganization(
          {
            name: formData.newOrganization.name,
            organization_code: formData.newOrganization.organization_code,
            website: formData.newOrganization.website
          },
          connection
        );
        if (formData.newTeam) {
          const newTeam = await insertTeam(
            {
              name: formData.newTeam.name,
              organization_id: newOrg.insertId,
              org_approved: true
            },
            connection
          );
          await signUpTeamForSeason(
            {
              seasonId: season.id,
              teamId: newTeam.insertId,
              players: playersForTeamRegistration,
              teamExternalId: formData.teamExternalId,
              defects: formData.defects
            },
            connection
          );
        }
      }
    }

    // Handle existing org and new team
    if (formData.organizationId !== -1) {
      if (formData.teamId === -1) {
        if (formData.newTeam) {
          const newTeam = await insertTeam(
            {
              name: formData.newTeam.name,
              organization_id: formData.organizationId,
              org_approved: false
            },
            connection
          );
          await signUpTeamForSeason(
            {
              seasonId: season.id,
              teamId: newTeam.insertId,
              players: playersForTeamRegistration,
              teamExternalId: formData.teamExternalId,
              defects: formData.defects
            },
            connection
          );
        }
      }
    }

    // Handle existing organization and existing team
    if (formData.organizationId !== -1 && formData.teamId !== -1) {
      // Ensure the team belongs to the organization
      const isTeamPartOfOrg = await isTeamPartOfOrganization(
        formData.teamId,
        formData.organizationId
      );
      if (!isTeamPartOfOrg) {
        res.status(400).json({
          message: "Team does not belong to the selected organization"
        });
        return;
      }
      await signUpTeamForSeason(
        {
          seasonId: season.id,
          teamId: formData.teamId,
          players: playersForTeamRegistration,
          teamExternalId: formData.teamExternalId,
          defects: formData.defects
        },
        connection
      );
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  // If teamId -1, then create a new team

  res.json({ "Season signup": true });
};
