import { type Request, type Response } from "express";
import {
  registerPlayerForKanahautomo,
  getKanahautomoRegistrationsByPlayer
} from "../models/kanahautomo.models";
import { getOrganizationById } from "../models/organization.models";
import { logger } from "../utils/app-logger";

export const registerForKanahautomo = async (req: Request, res: Response) => {
  try {
    // JWT authentication ensures req.auth exists
    if (!req.auth) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { organization_id } = req.body;
    const steamId = req.auth.provider_id; // From JWT token

    // Validate organization_id
    if (!organization_id || typeof organization_id !== "number") {
      res.status(400).json({
        error: "organization_id is required and must be a number"
      });
      return;
    }

    // Check if organization exists
    const organization = await getOrganizationById(organization_id);
    if (!organization || organization.length === 0) {
      res.status(404).json({
        error: "Organization not found"
      });
      return;
    }

    // Check if player is already registered
    const existingRegistration =
      await getKanahautomoRegistrationsByPlayer(steamId);
    if (existingRegistration && existingRegistration.length > 0) {
      res.status(409).json({
        error: "Player is already registered for Kanahautomo",
        registration: existingRegistration[0]
      });
      return;
    }

    // Register player for Kanahautomo
    const result = await registerPlayerForKanahautomo(steamId, organization_id);

    logger.info(
      `Player ${steamId} registered for Kanahautomo in organization ${organization_id}`
    );

    res.status(201).json({
      message: "Successfully registered for Kanahautomo",
      registration_id: result[0].insertId,
      organization_id,
      steam_id: steamId
    });
  } catch (error) {
    logger.error("Error registering for Kanahautomo:", error);
    res.status(500).json({
      error: "Internal server error"
    });
  }
};
