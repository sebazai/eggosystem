import { Router } from "express";
import {
  handleDiscordWebhook,
  getOrganizationDiscordStatus,
  getUserDiscordStatus
} from "../../controllers/discord.controllers";
import { authenticateJWT } from "../../middlewares/auth.middleware";
import { validateNumericParams } from "../../middlewares/validate-numeric-params";

const router = Router();

// Webhook endpoint (no authentication required for Discord webhooks)
router.post("/webhook", handleDiscordWebhook);

// Get organization Discord status
router.get(
  "/organization/:organizationId/status",
  validateNumericParams(),
  getOrganizationDiscordStatus
);

// Get user's Discord status
router.get("/user/status", authenticateJWT, getUserDiscordStatus);

export default router;
