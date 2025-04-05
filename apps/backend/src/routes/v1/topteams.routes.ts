import { Router } from "express";
import type { Request, Response } from "express";
import { validateTopTeamsParams } from "../../middlewares/topteams.middleware";
import { getTopTeams } from "../../models/topteams.models";

interface TopTeamsQuery {
  league_id: string | number;
  season_id: string | number;
  stage?: string | number;
  map_id?: string | number;
  [key: string]: string | number | undefined;
}

const router = Router();

router.get(
  "/",
  validateTopTeamsParams,
  async (
    req: Request<unknown, unknown, unknown, TopTeamsQuery>,
    res: Response
  ): Promise<void> => {
    const { league_id, season_id, stage, map_id } = req.query;

    const topTeams = await getTopTeams(
      Number(league_id),
      Number(season_id),
      stage ? Number(stage) : undefined,
      map_id ? Number(map_id) : undefined
    );

    res.json(topTeams);
  }
);

export default router;
