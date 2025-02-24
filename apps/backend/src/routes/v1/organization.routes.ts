import { Router } from "express";
import { fetchOrganizations } from "../../controllers/organizations.controllers";

const router = Router();

router.get("/", fetchOrganizations);

export default router;
