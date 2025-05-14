import { Router } from "express";
import { type Request, type Response } from "express";
import { checkPermissions } from "../../../middlewares/auth.middleware";
import teamsRouter from "./team.routes";
const router = Router();

router.use("/teams", teamsRouter);
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
