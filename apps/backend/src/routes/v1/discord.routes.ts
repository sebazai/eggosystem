import { Router } from "express";
import { getUserDiscordStatus } from "../../controllers/discord.controllers";
import { authenticateJWT } from "../../middlewares/auth.middleware";

const router = Router();

// Get user's Discord status
router.get("/user/status", authenticateJWT, getUserDiscordStatus);

export default router;
