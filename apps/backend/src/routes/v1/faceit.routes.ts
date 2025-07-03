import { Router } from "express";
import {
  getFaceITTeamDetails,
  getFaceITMatchDetails
} from "../../services/faceit.services";
import { type Request, type Response } from "express";
import { authenticateJWT } from "../../middlewares/auth.middleware";
import { saveWebhookData } from "../../models/faceit.models";
import { logger } from "../../utils/app-logger";
import { type RequestWithBody } from "@eggosystem/types";
import { addMatchToDatabase } from "../../models/match.models";

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

export interface FaceITWebhookPlayer {
  id: string;
  nickname: string;
  avatar: string;
  game_id: string;
  game_name: string;
  game_skill_level: number;
  membership: string;
  anticheat_required?: boolean;
}

export interface FaceITWebhookTeam {
  id: string;
  name: string;
  type: string;
  avatar: string;
  leader_id: string;
  co_leader_id: string;
  roster: FaceITWebhookPlayer[];
  substitutions: number;
  substitutes: FaceITWebhookPlayer[];
}

export interface FaceITWebhookEntity {
  id: string;
  name: string;
  type: string;
}

export interface FaceITPayloadMatchStatusConfiguring {
  id: string;
  organizer_id: string;
  region: string;
  game: string;
  version: number;
  entity: FaceITWebhookEntity;
  teams: FaceITWebhookTeam[];
  created_at: string;
  updated_at: string;
}

export interface FaceITPayloadMatchDemoReady
  extends FaceITPayloadMatchStatusConfiguring {
  demo_url: string;
}

export interface FaceITPayloadMatchStatusFinished
  extends FaceITPayloadMatchStatusConfiguring {
  started_at: string;
  finished_at: string;
}

export interface FaceITPayloadMatchObjectCreated {
  id: string;
  organizer_id: string;
  region: string;
  game: string;
  version: number;
  entity: FaceITWebhookEntity;
  created_at: string;
  updated_at: string;
}

export type FaceITWebhookData = {
  id: number;
  received_at: string;
  data:
    | FaceITWebhookDataBase<
        "match_status_configuring",
        FaceITPayloadMatchStatusConfiguring
      >
    | FaceITWebhookDataBase<
        "match_status_ready",
        FaceITPayloadMatchStatusConfiguring
      >
    | FaceITWebhookDataBase<"match_demo_ready", FaceITPayloadMatchDemoReady>
    | FaceITWebhookDataBase<
        "match_status_finished",
        FaceITPayloadMatchStatusFinished
      >
    | FaceITWebhookDataBase<
        "match_object_created",
        FaceITPayloadMatchObjectCreated
      >;
};

export type FaceITWebhookDataBase<E extends string, P> = {
  transaction_id: string;
  event: E;
  event_id: string;
  third_party_id: string;
  app_id: string;
  timestamp: string;
  retry_count: number;
  version: number;
  payload: P;
  created_at: string;
  updated_at: string;
};

router.post(
  "/webhook",
  async (
    req: RequestWithBody<FaceITWebhookData>,
    res: Response
  ): Promise<void> => {
    const apiKey = req.header("X-API-KEY");
    if (!apiKey || apiKey !== process.env.FACEIT_WEBHOOK_API_KEY) {
      logger.warn(
        `Invalid or missing X-API-KEY on FaceIT webhook: received='${apiKey}'`
      );
      res.status(401).send("Unauthorized: Invalid API key");
      return;
    }
    try {
      const webhookData = req.body;
      // Save entire JSON to the database
      await saveWebhookData(webhookData);
      if (webhookData.data.event === "match_object_created") {
        const matchDetails = await getFaceITMatchDetails(
          webhookData.data.payload.id
        );
        if (!matchDetails) {
          logger.error(
            `Failed to fetch match details for match ${webhookData.data.payload.id}`
          );
          res.status(500).send("Failed to fetch match details");
          return;
        }

        const externalLeagueId = webhookData.data.payload.entity.id;
        await addMatchToDatabase(matchDetails, externalLeagueId);
      }
      if (webhookData.data.event === "match_status_finished") {
        // Update the match start and end time
      }
      if (webhookData.data.event === "match_status_ready") {
        // Get map vetos and bans here?
      }
      if (webhookData.data.event === "match_status_configuring") {
        // Do we need this?
      }
      if (webhookData.data.event === "match_demo_ready") {
        // Validate players in both teams and push the demo url to parser
      }

      res.status(200).send("Webhook received");
      return;
    } catch (error) {
      logger.error("Error handling webhook", error);
      res.status(500).send("Something went wrong");
      return;
    }
  }
);

export default router;
