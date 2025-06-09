import { Router } from "express";
import { stabilizeEloController } from "../../controllers/elo.controllers";

const router = Router();

// ELO stabilizer route
router.post("/stabilize", stabilizeEloController);

export default router;
