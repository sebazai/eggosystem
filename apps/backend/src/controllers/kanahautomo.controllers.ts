import { type Request, type Response } from "express";
import {
  registerPlayerForKanahautomo,
  getKanahautomoOrganizationStatus as getKanahautomoOrganizationStatusModel
} from "../models/kanahautomo.models";
import {
  getOrganizationById,
  insertOrganization
} from "../models/organization.models";
import { logger } from "../utils/app-logger";
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

    // Register player for Kanahautomo (terms not accepted initially)
    const result = await registerPlayerForKanahautomo(
      steamId,
      finalOrganizationId,
      false // accepted_terms = false initially
    );

    const response: KanahautomoRegistrationResponse = {
      message: "Successfully registered for Kanahautomo",
      registration_id: result.insertId,
      organization_id: finalOrganizationId
    };

    logger.info(
      `Player ${steamId} registered for Kanahautomo in organization ${finalOrganizationId}`
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
  const data = await getKanahautomoOrganizationStatusModel();
  res.json({ organizations: data });
};
