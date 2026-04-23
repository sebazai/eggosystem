import { Router } from "express";
import {
  createDashboardMarketingSponsorController,
  deleteDashboardMarketingSponsorController,
  listDashboardMarketingSponsorsController,
  patchDashboardMarketingSponsorController,
  reorderDashboardMarketingSponsorsController
} from "../../../controllers/dashboard-marketing-sponsors.controllers";

const router = Router();

router.get("/", listDashboardMarketingSponsorsController);
router.post("/", createDashboardMarketingSponsorController);
router.put("/reorder", reorderDashboardMarketingSponsorsController);
router.patch("/:id", patchDashboardMarketingSponsorController);
router.delete("/:id", deleteDashboardMarketingSponsorController);

export default router;
