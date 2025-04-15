import { Router } from "express";
import { updateAccountProfile } from "../../controllers/account.controllers";

const router = Router();

router.post("/update", updateAccountProfile);

export default router;
