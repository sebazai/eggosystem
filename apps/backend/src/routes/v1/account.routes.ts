import { Router } from "express";
import { updateAccountProfileController } from "../../controllers/account.controllers";

const router = Router();

router.post("/update", updateAccountProfileController);

export default router;
