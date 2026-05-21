import { Router } from "express";
import {
  getNewsletterRecipientsController,
  sendNewsletterController
} from "../../../controllers/dashboard/newsletter.controllers";

const router = Router();

router.get("/recipients", getNewsletterRecipientsController);
router.post("/send", sendNewsletterController);

export default router;
