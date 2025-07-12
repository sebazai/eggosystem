import { Router } from "express";
import {
  getFaceITMatchDetails,
  getFaceITTeamDetails
} from "../../services/faceit.services";
import { type Request, type Response } from "express";
import { authenticateJWT } from "../../middlewares/auth.middleware";
import { getWebhookData, saveWebhookData } from "../../models/faceit.models";
import { logger } from "../../utils/app-logger";

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

router.post("/webhook", async (req: Request, res: Response) => {
  try {
    const webhookData = req.body;

    // Save entire JSON to the database
    await saveWebhookData(webhookData, null);

    res.status(200).send("Webhook received");
  } catch (error) {
    logger.error("Error handling webhook", error);
    res.status(500).send("Something went wrong");
  }
});

router.get("/webhook", async (req: Request, res: Response) => {
  try {
    const data = await getWebhookData();
    const mappedData = data.map((d) => ({ ...d, data: JSON.parse(d.data) }));

    res.status(200).json(mappedData);
  } catch (error) {
    logger.error("Error handling webhook data:", error);
    res.status(500).send("Something went wrong");
  }
});

router.post("/webhook-test", async (req: Request, res: Response) => {
  try {
    const webhookData = req.body;

    const matchDetails = await getFaceITMatchDetails(webhookData.payload.id);
    await saveWebhookData(webhookData, matchDetails);

    res.status(200).send("Webhook received");
  } catch (error) {
    logger.error("Error handling webhook", error);
    res.status(200).send("Something went wrong");
  }
});

export default router;
