import { type Request, type Response } from "express";
import {
  registerPlayerForKanahautomo,
  getKanahautomoRegistrationsByPlayerAndSeason,
  getKanahautomoOrganizationStatusForSeason,
  getKanahautomoRegistrationCounts as getKanahautomoRegistrationCountsModel
} from "../models/kanahautomo.models";
import {
  getOrganizationById,
  insertOrganization
} from "../models/organization.models";
import { logger } from "../utils/app-logger";
import { getActiveSignupSeasonForAppId } from "../models/season.models";
import { BadRequestError } from "../utils/errors";
import type {
  KanahautomoRegistration,
  KanahautomoRegistrationResponse
} from "@eggosystem/types";
import { getConnection } from "../db/mysqlConnection";

export const registerForKanahautomoWithOrganization = async (
  req: Request,
  res: Response
) => {
  // JWT authentication ensures req.auth exists
  if (!req.auth) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { organization_id, new_organization }: KanahautomoRegistration =
    req.body;
  const steamId = req.auth.provider_id; // From JWT token

  // Validate input
  if (!organization_id && !new_organization) {
    throw new BadRequestError(
      "Either organization_id or new_organization is required"
    );
  }

  if (organization_id && new_organization) {
    throw new BadRequestError(
      "Cannot provide both organization_id and new_organization"
    );
  }

  // Get the active season for CS2 (app_id 730)
  const activeSeason = await getActiveSignupSeasonForAppId(730);
  if (!activeSeason) {
    throw new BadRequestError("No active season found for CS2");
  }

  // Check if player is already registered for this season
  const existingRegistration =
    await getKanahautomoRegistrationsByPlayerAndSeason(
      steamId,
      activeSeason.season_id
    );
  if (existingRegistration && existingRegistration.length > 0) {
    res.status(400).json({
      error: "Player is already registered for this season"
    });
    return;
  }

  const connection = await getConnection();
  try {
    await connection.beginTransaction();
    let finalOrganizationId: number;
    if (new_organization) {
      // Create new organization
      const newOrgResult = await insertOrganization(
        new_organization,
        connection
      );
      finalOrganizationId = newOrgResult.insertId;
    } else if (organization_id) {
      // Verify existing organization exists
      const organization = await getOrganizationById(organization_id);
      if (!organization || organization.length === 0) {
        throw new BadRequestError("Organization not found");
      }
      finalOrganizationId = organization_id;
    } else {
      throw new BadRequestError("Invalid request: no organization specified");
    }

    // Register player for Kanahautomo
    const result = await registerPlayerForKanahautomo(
      steamId,
      finalOrganizationId,
      activeSeason.season_id
    );

    const response: KanahautomoRegistrationResponse = {
      message: "Successfully registered for Kanahautomo",
      registration_id: result[0].insertId,
      organization_id: finalOrganizationId
    };

    logger.info(
      `Player ${steamId} registered for Kanahautomo in organization ${finalOrganizationId} for season ${activeSeason.season_id}`
    );

    await connection.commit();
    res.status(201).json(response);
  } catch (error) {
    await connection.rollback();
    logger.error(`Error registering for Kanahautomo: ${error}`);
    throw error;
  } finally {
    connection.release();
  }
};

export const getKanahautomoOrganizationStatus = async (
  req: Request,
  res: Response
) => {
  // Get the active season for CS2 (app_id 730)
  const activeSeason = await getActiveSignupSeasonForAppId(730);
  if (!activeSeason) {
    res.status(404).json({ error: "No active season found for CS2" });
    return;
  }
  const data = await getKanahautomoOrganizationStatusForSeason(
    activeSeason.season_id
  );
  res.json({ season_id: activeSeason.season_id, organizations: data });
};

export const getKanahautomoRegistrationCounts = async (
  req: Request,
  res: Response
) => {
  const data = await getKanahautomoRegistrationCountsModel();
  res.json(data);
};
