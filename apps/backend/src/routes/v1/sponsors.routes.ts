import { Router } from "express";
import { getPublicMarketingSponsorsController } from "../../controllers/public-marketing-sponsors.controllers";

const router = Router();

router.get("/", getPublicMarketingSponsorsController);

export default router;
