/* eslint-disable @typescript-eslint/no-unused-vars */
import { Router } from "express";
import {
  getFaceITTeamDetails,
  getFaceITMatchDetails
} from "../../services/faceit.services";
import { type Request, type Response } from "express";
import { authenticateJWT } from "../../middlewares/auth.middleware";
import { saveWebhookData } from "../../models/faceit.models";
import { logger } from "../../utils/app-logger";
import {
  type MatchStatusReadyWebhook,
  type MatchStatusConfiguringWebhook,
  type RequestWithBody,
  type MatchDemoReadyWebhook,
  type MatchStatusFinishedAfterAbortWebhook,
  type MatchStatusFinishedWebhook,
  type MatchObjectCreatedWebhook,
  type ChampionshipCreatedWebhook,
  validateMatchStatusFinishedWebhook,
  validateMatchStatusFinishedAfterAbortWebhook,
  validateMatchObjectCreatedWebhook,
  validateDetailsObjectCreated,
  type DetailsObjectCreated,
  WebhookValidationError,
  MatchDetailsValidationError,
  type MatchStatusAbortedWebhook,
  type MatchStatusCancelledWebhook,
  validateMatchStatusReadyWebhook,
  type DetailsConfiguring,
  validateMatchStatusConfiguringWebhook,
  validateMatchDemoReadyWebhook,
  type DetailsDemoReady,
  validateMatchStatusAbortedWebhook,
  validateMatchStatusCancelledWebhook,
  validateChampionshipCreatedWebhook
} from "@eggosystem/types";
import {
  addMatchToDatabase,
  updateMatchEndTime,
  updateMatchFinished
} from "../../models/match.models";
import { createApiKeyValidator } from "../../middlewares/api-key-auth.middleware";

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

type FaceITWebhookData = {
  id: number;
  received_at: string;
  data:
    | MatchStatusConfiguringWebhook
    | MatchStatusReadyWebhook
    | MatchStatusAbortedWebhook
    | MatchStatusCancelledWebhook
    | MatchDemoReadyWebhook
    | MatchStatusFinishedWebhook
    | MatchStatusFinishedAfterAbortWebhook
    | MatchObjectCreatedWebhook
    | ChampionshipCreatedWebhook;
};

const processWebhookWithDetails = async <
  W extends { payload: { id: string } },
  MD
>(
  webhookData: unknown,
  webhookValidator: (data: unknown) => W,
  getDetailsFunction: (id: string) => Promise<MD>,
  detailsValidator: (data: unknown) => MD,
  eventType: string
) => {
  // Validate webhook data
  const validatedWebhook = webhookValidator(webhookData);
  const externalMatchRoomId = validatedWebhook.payload.id;

  // Fetch and validate match details
  const matchDetails = await getDetailsFunction(externalMatchRoomId);
  const validatedMatchDetails = detailsValidator(matchDetails);

  // Save to database
  await saveWebhookData(
    externalMatchRoomId,
    eventType,
    JSON.stringify(validatedWebhook),
    JSON.stringify(validatedMatchDetails)
  );

  return { webhookData: validatedWebhook, matchDetails: validatedMatchDetails };
};

router.post(
  "/webhook",
  createApiKeyValidator(process.env.FACEIT_WEBHOOK_API_KEY),
  async (
    req: RequestWithBody<FaceITWebhookData>,
    res: Response
  ): Promise<void> => {
    const webhookData = req.body;
    try {
      if (webhookData.data.event === "match_object_created") {
        const {
          webhookData: validatedWebhook,
          matchDetails: validatedMatchDetails
        } = await processWebhookWithDetails(
          webhookData.data,
          validateMatchObjectCreatedWebhook,
          getFaceITMatchDetails<DetailsObjectCreated>,
          validateDetailsObjectCreated,
          "match_object_created"
        );
        await addMatchToDatabase(
          validatedMatchDetails,
          validatedWebhook.payload.id
        );
      }

      // This should be ok now, but ensure this happens for Match, not MatchGame.
      if (webhookData.data.event === "match_status_finished") {
        if (validateMatchStatusFinishedWebhook(webhookData.data)) {
          const externalMatchRoomId = webhookData.data.payload.id;
          const startTime = webhookData.data.payload.started_at;
          if (
            // Match was aborted due to AFK.
            startTime === "1970-01-01T00:00:00Z" &&
            validateMatchStatusFinishedAfterAbortWebhook(webhookData.data)
          ) {
            const endTime = webhookData.data.payload.finished_at;
            // We do not want to change the match status, as this means it was aborted due to AFK.
            await updateMatchEndTime(webhookData.data.payload.id, endTime);
            await saveWebhookData(
              externalMatchRoomId,
              "match_status_finished",
              JSON.stringify(webhookData),
              null
            );
            return;
          }

          const endTime = webhookData.data.payload.finished_at;
          await updateMatchFinished(
            webhookData.data.payload.id,
            startTime,
            endTime
          );
          await saveWebhookData(
            externalMatchRoomId,
            "match_status_finished",
            JSON.stringify(webhookData),
            null
          );
          return;
        }
      }
      if (webhookData.data.event === "match_status_ready") {
        const {
          webhookData: validatedWebhook,
          matchDetails: validatedMatchDetails
        } = await processWebhookWithDetails(
          webhookData.data,
          validateMatchStatusReadyWebhook,
          getFaceITMatchDetails<DetailsObjectCreated>,
          validateDetailsObjectCreated,
          "match_status_ready"
        );
      }
      if (webhookData.data.event === "match_status_configuring") {
        // Get map vetos and bans here
        const {
          webhookData: validatedWebhook,
          matchDetails: validatedMatchDetails
        } = await processWebhookWithDetails(
          webhookData.data,
          validateMatchStatusConfiguringWebhook,
          getFaceITMatchDetails<DetailsConfiguring>,
          validateDetailsObjectCreated,
          "match_status_ready"
        );
      }
      if (webhookData.data.event === "match_demo_ready") {
        // Validate players in both teams and push the demo url to parser
        // Send demo_url to parser
        const {
          webhookData: validatedWebhook,
          matchDetails: validatedMatchDetails
        } = await processWebhookWithDetails(
          webhookData.data,
          validateMatchDemoReadyWebhook,
          getFaceITMatchDetails<DetailsDemoReady>,
          validateDetailsObjectCreated,
          "match_status_ready"
        );
      }
      if (webhookData.data.event === "match_status_aborted") {
        // Do we need this?
        const {
          webhookData: validatedWebhook,
          matchDetails: validatedMatchDetails
        } = await processWebhookWithDetails(
          webhookData.data,
          validateMatchStatusAbortedWebhook,
          getFaceITMatchDetails<DetailsObjectCreated>,
          validateDetailsObjectCreated,
          "match_status_ready"
        );
      }
      if (webhookData.data.event === "match_status_cancelled") {
        // Do we need this?
        const {
          webhookData: validatedWebhook,
          matchDetails: validatedMatchDetails
        } = await processWebhookWithDetails(
          webhookData.data,
          validateMatchStatusCancelledWebhook,
          getFaceITMatchDetails<DetailsObjectCreated>,
          validateDetailsObjectCreated,
          "match_status_ready"
        );
      }
      if (webhookData.data.event === "championship_created") {
        // Parse the name and add to database SeasonLeagueExternalRooms
        // Add type (roundRobin etc.)
        const {
          webhookData: validatedWebhook,
          matchDetails: validatedMatchDetails
        } = await processWebhookWithDetails(
          webhookData.data,
          validateChampionshipCreatedWebhook,
          getFaceITMatchDetails<DetailsObjectCreated>,
          validateDetailsObjectCreated,
          "championship_created"
        );
      }

      res.status(200).send("Webhook received");
      return;
    } catch (error) {
      const externalMatchRoomId = webhookData.data.payload.id;
      if (error instanceof WebhookValidationError) {
        logger.error("Webhook validation error", error);
        await saveWebhookData(
          externalMatchRoomId,
          webhookData.data.event,
          JSON.stringify(webhookData),
          JSON.stringify(error),
          "WEBHOOK_VALIDATION_ERROR"
        );
      }
      if (error instanceof MatchDetailsValidationError) {
        logger.error("Match details validation error", error);
        await saveWebhookData(
          externalMatchRoomId,
          webhookData.data.event,
          JSON.stringify(webhookData),
          JSON.stringify(error),
          "MATCH_DETAILS_VALIDATION_ERROR"
        );
      }
      logger.error("Error handling webhook", error);
      await saveWebhookData(
        externalMatchRoomId,
        webhookData.data.event,
        JSON.stringify(webhookData),
        JSON.stringify(error),
        "UNKNOWN_ERROR"
      );
      res.status(500).send("Something went wrong");
      return;
    }
  }
);

export default router;
