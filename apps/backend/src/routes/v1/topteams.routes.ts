import { Router } from "express";
import type { Request, Response } from "express";
import { getTopTeams } from "../../models/topteams.models";
import parseQueryParams from "../../middlewares/parse-query-params.middleware";

const router = Router();

router.get(
  "/",
  parseQueryParams,
  async (req: Request, res: Response): Promise<void> => {
    const topTeams = await getTopTeams(req.parsedParams);

    res.json(topTeams);
  }
);

export default router;
