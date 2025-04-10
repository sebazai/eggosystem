import { Router } from "express";
import { getAllMaps } from "../../controllers/maps.controllers";

const router = Router();

router.get("/", getAllMaps);

export default router;
