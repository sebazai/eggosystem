import { Router } from "express";
import {
  fetchSeasons,
  fetchSeasonById
} from "../../controllers/seasons.controllers";

const router = Router();

router.get("/", fetchSeasons);
router.get("/:id", fetchSeasonById);

export default router;
