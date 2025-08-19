import { Router } from "express";
import { getFlaggedMatchesController } from "../../../controllers/dashboard/matches.controllers";

const router = Router();

router.get("/flagged", getFlaggedMatchesController);

export default router;
