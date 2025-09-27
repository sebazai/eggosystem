import { Router } from "express";
import { type Request, type Response, type NextFunction } from "express";
import { isAllstarClipError } from "@eggosystem/types";
import {
  updateClipError,
  updateProcessedClip
} from "../../models/allstar.models";
import { logger } from "../../utils/app-logger";
import {
  UnauthorizedError,
  BadRequestError,
  InternalServerError
} from "../../utils/errors";

const router = Router();

router.post(
  "/webhook",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check header Authorization that it is "token <uuid>", uuid is my env
      const authorization = req.headers.authorization;
      if (!authorization) {
        logger.error("Unauthorized request to Allstar webhook");
        return next(new UnauthorizedError("Unauthorized"));
      }

      const [, token] = authorization.split(" ");
      if (token !== process.env.ALLSTAR_WEBHOOK_TOKEN) {
        logger.error(
          `Unauthorized request to Allstar webhook with token ${token.slice(
            0,
            5
          )}...`
        );
        return next(new UnauthorizedError("Unauthorized"));
      }

      const webhookData = req.body;

      if (isAllstarClipError(webhookData)) {
        logger.error("Allstar clip error", webhookData);
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

        const matchGameId = status.clip.metadata.find(
          (item: { key: string; value: string }) => item.key === "match_game_id"
        )?.value;

        if (!matchGameId) {
          return next(
            new BadRequestError(
              "Match game id not found in Allstar error handling"
            )
          );
        }

        await updateClipError(matchGameId, "potg", webhookData);
        res.status(200).send("Allstar clip error");
        return;
      }

      const matchGameId: string | undefined = webhookData.additionalData.find(
        (item: { key: string; value: string }) => item.key === "match_game_id"
      )?.value;

      if (!matchGameId) {
        return next(
          new BadRequestError("Match game id not found from Allstar webhook")
        );
      }

      const matchGameIdNumber = parseInt(matchGameId);
      if (isNaN(matchGameIdNumber)) {
        return next(new BadRequestError("Match game id is not a number"));
      }

      await updateProcessedClip(matchGameIdNumber, "potg", webhookData);

      res.status(200).send("Webhook received and processed");
    } catch (error) {
      logger.error("Error handling Allstar webhook", error);
      return next(new InternalServerError("Something went wrong"));
    }
  }
);

export default router;
