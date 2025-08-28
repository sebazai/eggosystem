import { Router } from "express";
import { type Request, type Response } from "express";
import { checkPermissions } from "../../../middlewares/auth.middleware";
import teamsRouter from "./team.routes";
import organizationRouter from "./organization.routes";
import registrationRouter from "./registration.routes";
import sortterRouter from "./sortter.routes";
import matchRouter from "./match.routes";
import seasonRouter from "./season.routes";

const router = Router();

router.use(
  "/seasons",
  checkPermissions({
    fallbackRoles: ["admin", "helpdesk"]
  }),
  seasonRouter
);
router.use(
  "/teams",
  checkPermissions({
    fallbackRoles: ["admin", "helpdesk"]
  }),
  teamsRouter
);
router.use(
  "/organizations",
  checkPermissions({
    fallbackRoles: ["admin", "helpdesk"]
  }),
  organizationRouter
);
router.use(
  "/registration",
  checkPermissions({
    fallbackRoles: ["admin"]
  }),
  registrationRouter
);
router.use(
  "/sortter",
  checkPermissions({
    fallbackRoles: ["admin"]
  }),
  sortterRouter
);
router.use(
  "/matches",
  checkPermissions({
    fallbackRoles: ["admin", "helpdesk"]
  }),
  matchRouter
);
router.get(
  "/",
  checkPermissions({
    staticPermissions: ["read:dashboard"],
    fallbackRoles: ["admin"]
  }),
  async (req: Request, res: Response) => {
    res.json({ OK: 200 });
  }
);

export default router;
