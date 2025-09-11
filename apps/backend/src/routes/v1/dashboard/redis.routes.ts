import { Router } from "express";
import {
  getRedisKeys,
  getRedisKeyData,
  deleteRedisKey
} from "../../../controllers/dashboard/redis.controllers";
import { checkPermissions } from "../../../middlewares/auth.middleware";

const router = Router();

// Get Redis keys (admin and helpdesk can view)
router.get(
  "/keys",
  checkPermissions({ fallbackRoles: ["admin", "helpdesk"] }),
  getRedisKeys
);

// Get specific key data (admin and helpdesk can view)
router.get(
  "/keys/:key",
  checkPermissions({ fallbackRoles: ["admin", "helpdesk"] }),
  getRedisKeyData
);

// Delete Redis key (admin only)
router.delete(
  "/keys/:key",
  checkPermissions({ fallbackRoles: ["admin"] }),
  deleteRedisKey
);

export default router;
