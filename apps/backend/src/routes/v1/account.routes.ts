import { Router } from "express";
import { updateAccount } from "../../controllers/account.controllers";

const router = Router();

router.post("/update", updateAccount);

export default router;
