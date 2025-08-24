import { Router } from "express";
import { stabilizeEloController } from "../../controllers/elo.controllers";
import { createApiKeyValidator } from "../../middlewares/api-key-auth.middleware";
import { getTeamFlags } from "../../services/elo.services";

const router = Router();

// ELO stabilizer route - protected with API key
router.post(
  "/stabilize",
  createApiKeyValidator(process.env.BACKEND_SERVICE_API_KEY),
  stabilizeEloController
);

// Test route to get team flags without authentication
router.get("/team-flags-test", async (req, res, next) => {
  try {
    const flags = await getTeamFlags();
    res.json(flags);
  } catch (error) {
    next(error);
  }
});

export default router;
