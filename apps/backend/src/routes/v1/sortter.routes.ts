import {
  Router,
  type Request,
  type Response,
  type NextFunction
} from "express";
import {
  getTeamValuesController,
  getTeamValueByIdController,
  getTeamPlayerValuesController,
  getTeamsForSeasonController,
  checkPlayerAdditionEligibilityController
} from "../../controllers/sortter.controllers";
import {
  getPreliminaryPlacementsController,
  savePreliminaryPlacementsController,
  finalizeTeamPlacementsController,
  getPlacementsFinalizationStatusController
} from "../../controllers/sortter-placements.controllers";
import { populateKanaeloQueueController } from "../../controllers/kanaelo.controllers";
import { validateNumericParams } from "../../middlewares/validate-numeric-params";
import {
  authenticateJWT,
  checkJWTPermissions
} from "../../middlewares/auth.middleware";
import { logger } from "../../utils/app-logger";
import { UnauthorizedError } from "../../utils/errors";

const router = Router();

// GET /api/v1/sortter/season/:season_id
router.get(
  "/season/:season_id",
  validateNumericParams(["season_id"]),
  getTeamValuesController
);

// GET /api/v1/sortter/season/:season_id/team/:team_id
router.get(
  "/season/:season_id/team/:team_id",
  validateNumericParams(["season_id", "team_id"]),
  getTeamValueByIdController
);

// GET /api/v1/sortter/season/:season/team/:team/playervalues
router.get(
  "/season/:season/team/:team/playervalues",
  validateNumericParams(["season", "team"]),
  getTeamPlayerValuesController
);

// GET /api/v1/sortter/season/:season_id/teams
router.get(
  "/season/:season_id/teams",
  validateNumericParams(["season_id"]),
  getTeamsForSeasonController
);

// GET /api/v1/sortter/season/:season_id/team/:team_id/player/:steam_id/eligibility
router.get(
  "/season/:season_id/team/:team_id/player/:steam_id/eligibility",
  validateNumericParams(["season_id", "team_id"]),
  checkPlayerAdditionEligibilityController
);

// Helper middleware to try API key first, fall back to JWT
const tryApiKeyThenJWT = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Check for API key first
  const apiKey = req.headers["x-api-key"];
  if (apiKey && apiKey === process.env.BACKEND_SERVICE_API_KEY) {
    logger.info("API key authentication successful");
    return next(); // API key is valid, proceed
  }

  // If no valid API key, use JWT authentication
  void authenticateJWT(req, res, (err) => {
    if (err) {
      return next(
        new UnauthorizedError(
          "Authentication required. Please provide a valid token or API key."
        )
      );
    }

    // Check JWT permissions
    void checkJWTPermissions({ fallbackRoles: ["admin"] })(req, res, next);
  });
};

// POST /api/v1/sortter/season/:season_id/populate-kanaelo-queue
router.post(
  "/season/:season_id/populate-kanaelo-queue",
  tryApiKeyThenJWT,
  validateNumericParams(["season_id"]),
  populateKanaeloQueueController
);

// GET /api/v1/sortter/season/:season_id/placements
router.get(
  "/season/:season_id/placements",
  validateNumericParams(["season_id"]),
  getPreliminaryPlacementsController
);

// GET /api/v1/sortter/season/:season_id/finalization-status
router.get(
  "/season/:season_id/finalization-status",
  validateNumericParams(["season_id"]),
  getPlacementsFinalizationStatusController
);

// POST /api/v1/sortter/season/:season_id/placements
router.post(
  "/season/:season_id/placements",
  authenticateJWT,
  checkJWTPermissions({ fallbackRoles: ["admin"] }),
  validateNumericParams(["season_id"]),
  savePreliminaryPlacementsController
);

// POST /api/v1/sortter/season/:season_id/finalize
router.post(
  "/season/:season_id/finalize",
  authenticateJWT,
  checkJWTPermissions({ fallbackRoles: ["admin"] }),
  validateNumericParams(["season_id"]),
  finalizeTeamPlacementsController
);

export default router;
