import { Router } from "express";
import { fetchLeagues } from "../../controllers/leagues.controllers";

const router = Router();

router.get("/", fetchLeagues);

export default router;
