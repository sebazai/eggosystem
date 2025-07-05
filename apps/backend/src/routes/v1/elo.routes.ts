import { Router } from "express";
import { stabilizeEloController } from "../../controllers/elo.controllers";
import { validateApiKey } from "../../middlewares/api-key-auth.middleware";

const router = Router();

// ELO stabilizer route - protected with API key
router.post("/stabilize", validateApiKey, stabilizeEloController);

export default router;
