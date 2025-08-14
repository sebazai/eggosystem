import { Router } from "express";
import { getUserDiscordStatus } from "../../controllers/discord.controllers";
import { authenticateJWT } from "../../middlewares/auth.middleware";

const router = Router();

router.get("/user/status", authenticateJWT, getUserDiscordStatus);

export default router;
