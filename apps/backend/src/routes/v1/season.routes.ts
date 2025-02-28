import { Router } from "express";
import { fetchSeasons } from "../../controllers/seasons.controllers";

const router = Router();

router.get("/", fetchSeasons);

export default router;
