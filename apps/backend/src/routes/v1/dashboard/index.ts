import { Router } from "express";
import { type Request, type Response } from "express";
import { checkPermissions } from "../../../middlewares/auth.middleware";
import teamsRouter from "./team.routes";
import organizationRouter from "./organization.routes";
import registrationRouter from "./registration.routes";
import sortterRouter from "./sortter.routes";
import matchRouter from "./match.routes";

const router = Router();

router.use("/teams", teamsRouter);
router.use("/organizations", organizationRouter);
router.use("/registration", registrationRouter);
router.use("/sortter", sortterRouter);
router.use("/matches", matchRouter);
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
