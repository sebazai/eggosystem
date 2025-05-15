import { Router } from "express";
import { getOrgs } from "../../../controllers/organizations.controllers";

const router = Router();

router.get("/", getOrgs);

export default router;
