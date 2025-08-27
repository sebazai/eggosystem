import { Router } from "express";
import { triggerFaceitMatchSync } from "../../controllers/faceit-sync.controllers";

const faceitSyncRouter = Router();

/**
 * POST /api/v1/faceit-sync/trigger
 * Manually trigger FACEIT match synchronization
 * This endpoint is useful for testing or manual operations
 */
faceitSyncRouter.post("/trigger", triggerFaceitMatchSync);

export default faceitSyncRouter;
