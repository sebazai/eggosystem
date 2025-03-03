import { Router } from "express";
import { fetchMaps } from "../../controllers/maps.controllers";

const router = Router();

router.get("/", fetchMaps);

export default router;
