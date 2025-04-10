import { Router } from "express";
import {
  getOrgs,
  getOrgById,
  getOrgTeams
} from "../../controllers/organizations.controllers";

const router = Router();

router.get("/", getOrgs);
router.get("/:id", getOrgById);
router.get("/:id/teams", getOrgTeams);

export default router;
