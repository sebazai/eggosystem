/* eslint-disable @typescript-eslint/no-explicit-any */
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

type FaceITWebhookData =
  | MatchStatusConfiguringWebhook
  | MatchStatusReadyWebhook
  | MatchStatusAbortedWebhook
  | MatchStatusCancelledWebhook
  | MatchDemoReadyWebhook
  | MatchStatusFinishedWebhook
  | MatchStatusFinishedAfterAbortWebhook
  | MatchObjectCreatedWebhook
  | ChampionshipCreatedWebhook;

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
  let matchDetails: MD | null = null;
  let externalMatchRoomId = "";
  try {
    // Validate webhook data
    const validatedWebhook = webhookValidator(webhookData);
    externalMatchRoomId = validatedWebhook.payload.id;

    // Fetch and validate match details
    matchDetails = await getDetailsFunction(externalMatchRoomId);
    const validatedMatchDetails = detailsValidator(matchDetails);

    // Save to database
    await saveWebhookData(
      externalMatchRoomId,
      eventType,
      JSON.stringify(validatedWebhook),
      JSON.stringify(validatedMatchDetails)
    );

    return {
      webhookData: validatedWebhook,
      matchDetails: validatedMatchDetails
    };
  } catch (error) {
    if (error instanceof WebhookValidationError) {
      logger.error("Webhook validation error", error);
      await saveWebhookData(
        externalMatchRoomId,
        String((webhookData as any).event),
        JSON.stringify(webhookData),
        JSON.stringify(matchDetails),
        "WEBHOOK_VALIDATION_ERROR",
        JSON.stringify(error)
      );
      throw error;
    }
    if (error instanceof MatchDetailsValidationError) {
      logger.error("Match details validation error", error);
      await saveWebhookData(
        externalMatchRoomId,
        String((webhookData as any).event),
        JSON.stringify(webhookData),
        JSON.stringify(matchDetails),
        "MATCH_DETAILS_VALIDATION_ERROR",
        JSON.stringify(error)
      );
      throw error;
    }
    logger.error("Error handling webhook", error);
    await saveWebhookData(
      externalMatchRoomId,
      String((webhookData as any).event),
      JSON.stringify(webhookData),
      JSON.stringify(matchDetails),
      "UNKNOWN_ERROR",
      JSON.stringify(error)
    );
    throw error;
  }
};

router.post(
  "/webhook",
  createApiKeyValidator(process.env.FACEIT_WEBHOOK_API_KEY),
  async (
    req: RequestWithBody<FaceITWebhookData>,
    res: Response
  ): Promise<void> => {
    const webhookData = req.body;

    if (webhookData.event === "match_object_created") {
      const {
        webhookData: validatedWebhook,
        matchDetails: validatedMatchDetails
      } = await processWebhookWithDetails(
        webhookData,
        validateMatchObjectCreatedWebhook,
        getFaceITMatchDetails<DetailsObjectCreated>,
        validateDetailsObjectCreated,
        "match_object_created"
      );
      await addMatchToDatabase(
        validatedMatchDetails,
        validatedWebhook.payload.entity.id
      );
    }

    // This should be ok now, but ensure this happens for Match, not MatchGame.
    if (webhookData.event === "match_status_finished") {
      if (validateMatchStatusFinishedWebhook(webhookData)) {
        const externalMatchRoomId = webhookData.payload.id;
        const startTime = webhookData.payload.started_at;
        if (
          // Match was aborted due to AFK.
          startTime === "1970-01-01T00:00:00Z" &&
          validateMatchStatusFinishedAfterAbortWebhook(webhookData)
        ) {
          const endTime = webhookData.payload.finished_at;
          // We do not want to change the match status, as this means it was aborted due to AFK.
          await updateMatchEndTime(webhookData.payload.id, endTime);
          await saveWebhookData(
            externalMatchRoomId,
            "match_status_finished",
            JSON.stringify(webhookData),
            null
          );
          return;
        }

        const endTime = webhookData.payload.finished_at;
        await updateMatchFinished(webhookData.payload.id, startTime, endTime);
        await saveWebhookData(
          externalMatchRoomId,
          "match_status_finished",
          JSON.stringify(webhookData),
          null
        );
        return;
      }
    }
    if (webhookData.event === "match_status_ready") {
      const {
        webhookData: validatedWebhook,
        matchDetails: validatedMatchDetails
      } = await processWebhookWithDetails(
        webhookData,
        validateMatchStatusReadyWebhook,
        getFaceITMatchDetails<DetailsObjectCreated>,
        validateDetailsObjectCreated,
        "match_status_ready"
      );
    }
    if (webhookData.event === "match_status_configuring") {
      // Get map vetos and bans here
      const {
        webhookData: validatedWebhook,
        matchDetails: validatedMatchDetails
      } = await processWebhookWithDetails(
        webhookData,
        validateMatchStatusConfiguringWebhook,
        getFaceITMatchDetails<DetailsConfiguring>,
        validateDetailsObjectCreated,
        "match_status_ready"
      );
    }
    if (webhookData.event === "match_demo_ready") {
      // Validate players in both teams and push the demo url to parser
      // Send demo_url to parser
      const {
        webhookData: validatedWebhook,
        matchDetails: validatedMatchDetails
      } = await processWebhookWithDetails(
        webhookData,
        validateMatchDemoReadyWebhook,
        getFaceITMatchDetails<DetailsDemoReady>,
        validateDetailsObjectCreated,
        "match_status_ready"
      );
    }
    if (webhookData.event === "match_status_aborted") {
      // Do we need this?
      const {
        webhookData: validatedWebhook,
        matchDetails: validatedMatchDetails
      } = await processWebhookWithDetails(
        webhookData,
        validateMatchStatusAbortedWebhook,
        getFaceITMatchDetails<DetailsObjectCreated>,
        validateDetailsObjectCreated,
        "match_status_ready"
      );
    }
    if (webhookData.event === "match_status_cancelled") {
      // Do we need this?
      const {
        webhookData: validatedWebhook,
        matchDetails: validatedMatchDetails
      } = await processWebhookWithDetails(
        webhookData,
        validateMatchStatusCancelledWebhook,
        getFaceITMatchDetails<DetailsObjectCreated>,
        validateDetailsObjectCreated,
        "match_status_ready"
      );
    }
    if (webhookData.event === "championship_created") {
      // Parse the name and add to database SeasonLeagueExternalRooms
      // Add type (roundRobin etc.)
      const {
        webhookData: validatedWebhook,
        matchDetails: validatedMatchDetails
      } = await processWebhookWithDetails(
        webhookData,
        validateChampionshipCreatedWebhook,
        getFaceITMatchDetails<DetailsObjectCreated>,
        validateDetailsObjectCreated,
        "championship_created"
      );
    }

    res.status(200).send("Webhook received");
    return;
  }
);

export default router;
