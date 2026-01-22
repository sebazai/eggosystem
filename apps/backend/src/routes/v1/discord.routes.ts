import { Router } from "express";
import {
  getUserDiscordStatus,
  unlinkDiscordAccountController
} from "../../controllers/discord.controllers";
import { authenticateJWT } from "../../middlewares/auth.middleware";

const router = Router();

router.get("/user/status", authenticateJWT, getUserDiscordStatus);
router.delete("/unlink", authenticateJWT, unlinkDiscordAccountController);

export default router;
