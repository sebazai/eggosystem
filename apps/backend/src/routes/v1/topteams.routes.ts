import { Router } from "express";
import type { Request, Response } from "express";
import { getTopTeams } from "../../models/topteams.models";
import parseQueryFilterParams from "../../middlewares/parse-query-filter-params.middleware";

const router = Router();

router.get(
  "/",
  parseQueryFilterParams,
  async (req: Request, res: Response): Promise<void> => {
    const topTeams = await getTopTeams(req.parsedParams);

    res.json(topTeams);
  }
);

export default router;
