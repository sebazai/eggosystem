import { Router } from "express";
import { getAllLeagues } from "../../controllers/leagues.controllers";

const router = Router();

router.get("/", getAllLeagues);

export default router;
