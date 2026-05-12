import { Router } from "express";
import { type Request, type Response, type NextFunction } from "express";
import {
  authenticateJWT,
  checkPermissions
} from "../../middlewares/auth.middleware";
import { NotFoundError } from "../../utils/errors";
import { createApiKeyValidator } from "../../middlewares/api-key-auth.middleware";
import {
  triggerFaceitMatchSync,
  validateChampionshipTeamsController,
  getFaceitPlayerController
} from "../../controllers/faceit.controllers";
import { handleFaceitWebhook } from "../../controllers/faceit-webhook.controllers";
import { getFaceITTeamDetails } from "../../services/faceit.services";
import { validateNumericParams } from "../../middlewares/validate-numeric-params";

const router = Router();

router.post(
  "/sync/season/:season_id",
  validateNumericParams(),
  authenticateJWT,
  checkPermissions({ fallbackRoles: ["admin", "helpdesk"] }),
  triggerFaceitMatchSync
);

router.get(
  "/teams/:faceit_team_id",
  authenticateJWT,
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await getFaceITTeamDetails(req.params.faceit_team_id);
    if (!data) {
      return next(
        new NotFoundError(
          `FaceIT team not found with id ${req.params.faceit_team_id}`
        )
      );
    }
    res.json(data);
  }
);

router.get(
  "/championship/:championship_id/validate",
  authenticateJWT,
  validateChampionshipTeamsController
);

router.get("/players/:steam_id", getFaceitPlayerController);

router.post(
  "/webhook",
  createApiKeyValidator(process.env.FACEIT_WEBHOOK_API_KEY),
  handleFaceitWebhook
);

export default router;
