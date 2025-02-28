import { Router } from "express";
import { fetchTeams } from "../../controllers/teams.controllers";

const router = Router();

router.get("/", fetchTeams);

export default router;
