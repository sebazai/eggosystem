import { Router } from "express";
import {
  getRedisKeys,
  getRedisKeyData,
  deleteRedisKey,
  flushStandingsCaches
} from "../../../controllers/dashboard/redis.controllers";
import { checkPermissions } from "../../../middlewares/auth.middleware";

const router = Router();

// Flush standings caches (admin only) - must be before /keys/:key
router.post(
  "/flush-standings-caches",
  checkPermissions({ fallbackRoles: ["admin"] }),
  flushStandingsCaches
);

// Get Redis keys (admin and helpdesk can view)
router.get(
  "/keys",
  checkPermissions({ fallbackRoles: ["admin"] }),
  getRedisKeys
);

// Get specific key data (admin and helpdesk can view)
router.get(
  "/keys/:key",
  checkPermissions({ fallbackRoles: ["admin"] }),
  getRedisKeyData
);

// Delete Redis key (admin only)
router.delete(
  "/keys/:key",
  checkPermissions({ fallbackRoles: ["admin"] }),
  deleteRedisKey
);

export default router;
