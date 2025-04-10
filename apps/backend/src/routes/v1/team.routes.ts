import { Router } from "express";
import { getAllTeams } from "../../controllers/teams.controllers";

const router = Router();

router.get("/", getAllTeams);

export default router;
