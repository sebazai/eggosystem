import { Router } from "express";
import { type Request, type Response } from "express";
import { isAllstarClipError } from "@eggosystem/types";
import {
  updateClipError,
  updateProcessedClip
} from "../../models/allstar.models";

const router = Router();

router.post("/webhook", async (req: Request, res: Response) => {
  try {
    // Check header Authorization that it is "token <uuid>", uuid is my env
    const authorization = req.headers.authorization;
    if (!authorization) {
      res.status(401).send("Unauthorized");
      return;
    }

    const [, token] = authorization.split(" ");
    if (token !== process.env.ALLSTAR_WEBHOOK_TOKEN) {
      res.status(401).send("Unauthorized");
      return;
    }

    const webhookData = req.body;

    if (isAllstarClipError(webhookData)) {
      console.error("Allstar clip error:", webhookData);
      const apiKey = process.env.ALLSTAR_API_KEY;
      if (!apiKey) throw new Error("ALLSTAR_API_KEY is not set");
      const fetchStatus = await fetch(
        `https://prt.allstar.gg/cs/clip/status?clip_identifier=${webhookData.requestId}`,
        {
          headers: {
            "X-API-Key": apiKey,
            "Content-Type": "application/json"
          }
        }
      );
      const status = await fetchStatus.json();

      const gameId = status.clip.metadata.find(
        (item: { key: string; value: string }) => item.key === "game_id"
      )?.value;

      if (!gameId) {
        console.error("Game id not found in Allstar error handling");
        res.status(400).send("Game id not found in Allstar error handling");
        return;
      }

      await updateClipError(gameId, "potg", webhookData);
      res.status(200).send("Allstar clip error");
      return;
    }

    const gameId: string | undefined = webhookData.additionalData.find(
      (item: { key: string; value: string }) => item.key === "game_id"
    )?.value;

    if (!gameId) {
      console.error("Game id not found from Allstar webhook");
      res.status(400).send("Game id not found from Allstar webhook");
      return;
    }

    const gameIdNumber = parseInt(gameId);
    if (isNaN(gameIdNumber)) {
      console.error("Game id is not a number");
      res.status(400).send("Game id is not a number");
      return;
    }

    await updateProcessedClip(gameIdNumber, "potg", webhookData);

    res.status(200).send("Webhook received and processed");
  } catch (error) {
    console.error("Error handling Allstar webhook:", error);
    res.status(500).send("Something went wrong");
  }
});

export default router;
