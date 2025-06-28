import { type Request, type Response } from "express";
import {
  registerPlayerForKanahautomo,
  insertKanahautomoGameTypes,
  getKanahautomoOrganizationStatusWithGameTypes
} from "../models/kanahautomo.models";
import {
  getOrganizationById,
  insertOrganization
} from "../models/organization.models";
import { logger } from "../utils/app-logger";
import { BadRequestError } from "../utils/errors";
import type { KanahautomoRegistrationResponse } from "@eggosystem/types";
import { kanahautomoSchema } from "@eggosystem/types";
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

  const steamId = req.auth.provider_id; // From JWT token

  const parsed = kanahautomoSchema.parse(req.body);
  const { organizationId, newOrganization, gameTypes, acceptedTerms } = parsed;

  const connection = await getConnection();
  try {
    await connection.beginTransaction();
    let finalOrganizationId: number;

    if (newOrganization) {
      // Create new organization
      const newOrgResult = await insertOrganization(
        newOrganization,
        connection
      );
      finalOrganizationId = newOrgResult.insertId;
    } else if (organizationId && organizationId > 0) {
      // Verify existing organization exists
      const organization = await getOrganizationById(organizationId);
      if (!organization || organization.length === 0) {
        throw new BadRequestError("Organization not found");
      }
      finalOrganizationId = organizationId;
    } else {
      throw new BadRequestError("Invalid request: no organization specified");
    }

    // Register player for Kanahautomo
    const result = await registerPlayerForKanahautomo(
      steamId,
      finalOrganizationId,
      acceptedTerms,
      connection
    );

    // Insert selected game types
    await insertKanahautomoGameTypes(result.insertId, gameTypes, connection);

    const response: KanahautomoRegistrationResponse = {
      message: "Successfully registered for Kanahautomo",
      registrationId: result.insertId,
      organizationId: finalOrganizationId
    };

    logger.info(
      `Player ${steamId} registered for Kanahautomo in organization ${finalOrganizationId} with game types: ${Object.entries(
        gameTypes
      )
        .filter(([_, selected]) => selected)
        .map(([gameType, _]) => gameType)
        .join(", ")}`
    );

    await connection.commit();
    res.status(201).json(response);
  } catch (error) {
    await connection.rollback();
    logger.error(`Error registering for Kanahautomo: ${error}`);

    // Handle duplicate entry error gracefully
    if (error instanceof Error && error.message.includes("Duplicate entry")) {
      res.status(400).json({
        error: "Player is already registered for this organization"
      });
      return;
    }

    throw error;
  } finally {
    connection.release();
  }
};

export const getKanahautomoOrganizationStatus = async (
  req: Request,
  res: Response
) => {
  const data = await getKanahautomoOrganizationStatusWithGameTypes();
  res.json({ organizations: data });
};
