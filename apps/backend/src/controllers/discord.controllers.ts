import { type Request, type Response } from "express";
import { logger } from "../utils/app-logger";
import { getAccountById } from "../models/account.models";
import { runQuery } from "../db/mysqlRunQuery";

// Get user's Discord registration status
export const getUserDiscordStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.auth) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const accountId = req.auth.account_id;
    const account = await getAccountById(accountId);

    // Check if user has Discord username in their profile
    const hasDiscordUsername = !!account.discord;

    // Get user's Kanahautomo registrations
    const registrations = await runQuery<
      Array<{
        organization_id: number;
        organization_name: string;
        created_at: string;
      }>
    >(
      `
      SELECT 
        kr.organization_id,
        o.name as organization_name,
        kr.created_at
      FROM KanahautomoRegistrations kr
      JOIN Organizations o ON kr.organization_id = o.id
      WHERE kr.steam_id = ?
      ORDER BY kr.created_at DESC
    `,
      [req.auth.provider_id]
    );

    res.json({
      hasDiscordUsername,
      discordUsername: account.discord,
      kanahautomoRegistrations: registrations
    });
  } catch (error) {
    logger.error("Error getting user Discord status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
