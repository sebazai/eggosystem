import { Router } from "express";
import { stabilizeEloController } from "../../controllers/elo.controllers";
import { createApiKeyValidator } from "../../middlewares/api-key-auth.middleware";

const router = Router();

// ELO stabilizer route - protected with API key
router.post(
  "/stabilize",
  createApiKeyValidator(process.env.BACKEND_SERVICE_API_KEY),
  stabilizeEloController
);

export default router;
