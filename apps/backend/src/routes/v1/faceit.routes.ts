import { Router } from "express";
import { getFaceITTeamDetails } from "../../services/faceit.services";
import { type Request, type Response } from "express";
import { authenticateJWT } from "../../middlewares/auth.middleware";

const router = Router();

router.get(
  "/teams/:faceit_team_id",
  authenticateJWT,
  async (req: Request, res: Response) => {
    const data = await getFaceITTeamDetails(req.params.faceit_team_id);
    if (!data) {
      res.status(404).json({
        message: `FaceIT team not found with id ${req.params.faceit_team_id}`
      });
      return;
    }
    res.json(data);
  }
);

export default router;
