import { Router } from "express";
import { updateProfile } from "../../controllers/profile.controllers";

const router = Router();

router.post("/update", updateProfile);

export default router;
