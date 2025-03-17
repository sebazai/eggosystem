import { Router } from "express";
import {
  fetchOrganizations,
  fetchOrganizationById,
  fetchOrganizationTeams
} from "../../controllers/organizations.controllers";

const router = Router();

router.get("/", fetchOrganizations);
router.get("/:id", fetchOrganizationById);
router.get("/:id/teams", fetchOrganizationTeams);

export default router;
