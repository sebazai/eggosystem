import { Router } from "express";
import { getMyCasterApplicationsController } from "../../controllers/caster-applications.controllers";

const router = Router();

router.get("/me", getMyCasterApplicationsController);

export default router;
