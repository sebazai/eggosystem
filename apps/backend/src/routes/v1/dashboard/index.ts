import { Router } from "express";
import { type Request, type Response } from "express";
import { checkPermissions } from "../../../middlewares/auth.middleware";
import teamsRouter from "./team.routes";
import organizationRouter from "./organization.routes";
import registrationRouter from "./registration.routes";
import sortterRouter from "./sortter.routes";
import matchRouter from "./match.routes";
import seasonRouter from "./season.routes";
import playerRouter from "./player.routes";
import roleManagementRouter from "./role-management.routes";
import redisRouter from "./redis.routes";
import demoRouter from "./demo.routes";
import seasonLeagueMapperRouter from "./season-league-mapper.routes";
import faceitValidationRouter from "./faceit-validation.routes";
import emailVerificationRouter from "./email-verification.routes";
import casterApplicationsRouter from "./caster-applications.routes";
import playoffSeedsRouter from "./playoff-seeds.routes";
import marketingSponsorsRouter from "./marketing-sponsors.routes";

const router = Router();

router.use(
  "/seasons",
  checkPermissions({
    fallbackRoles: ["admin", "helpdesk"]
  }),
  seasonRouter
);
router.use(
  "/players",
  checkPermissions({
    fallbackRoles: ["admin", "helpdesk"]
  }),
  playerRouter
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
    fallbackRoles: ["admin", "helpdesk"]
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
router.use(
  "/role-management",
  checkPermissions({
    fallbackRoles: ["admin", "helpdesk"]
  }),
  roleManagementRouter
);
router.use(
  "/redis",
  checkPermissions({
    fallbackRoles: ["admin", "helpdesk"]
  }),
  redisRouter
);
router.use(
  "/demos",
  checkPermissions({
    fallbackRoles: ["admin", "helpdesk"]
  }),
  demoRouter
);
router.use(
  "/season-league-mapper",
  checkPermissions({
    fallbackRoles: ["admin"]
  }),
  seasonLeagueMapperRouter
);
router.use(
  "/faceit-validation",
  checkPermissions({
    fallbackRoles: ["admin", "helpdesk"]
  }),
  faceitValidationRouter
);
router.use(
  "/email-verification",
  checkPermissions({
    fallbackRoles: ["admin", "helpdesk"]
  }),
  emailVerificationRouter
);
router.use(
  "/caster-applications",
  checkPermissions({
    fallbackRoles: ["admin", "helpdesk"]
  }),
  casterApplicationsRouter
);
router.use(
  "/playoff-seeds",
  checkPermissions({
    fallbackRoles: ["admin", "helpdesk"]
  }),
  playoffSeedsRouter
);
router.use(
  "/sponsors",
  checkPermissions({
    fallbackRoles: ["admin"]
  }),
  marketingSponsorsRouter
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
