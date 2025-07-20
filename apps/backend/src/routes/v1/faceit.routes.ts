/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Router } from "express";
import {
  getFaceITTeamDetails,
  getFaceITMatchDetails,
  getFaceITChampionshipDetails,
  convertFaceitGameToAppId
} from "../../services/faceit.services";
import { type Request, type Response } from "express";
import { authenticateJWT } from "../../middlewares/auth.middleware";
import { saveWebhookData } from "../../models/faceit.models";
import { logger } from "../../utils/app-logger";
import { ZodError } from "zod";
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
  type MatchStatusAbortedWebhook,
  type MatchStatusCancelledWebhook,
  validateMatchStatusReadyWebhook,
  validateMatchStatusConfiguringWebhook,
  validateMatchmakingDetailsObjectCreated,
  type MatchmakingDetailsObjectCreated,
  validateChampionshipDetailsObjectCreated,
  type ChampionshipDetailsObjectCreated,
  validateMatchmakingDetailsConfiguring,
  type MatchmakingDetailsConfiguring,
  type ChampionshipDetailsConfiguring,
  validateChampionshipDetailsConfiguring,
  type ChampionshipDetailsReady,
  validateChampionshipDetailsReady,
  validateMatchmakingDetailsReady,
  type MatchmakingDetailsReady
} from "@eggosystem/types";
import {
  addMatchToDatabase,
  updateMatchEndTime,
  updateMatchFinished
} from "../../models/match.models";
import { createApiKeyValidator } from "../../middlewares/api-key-auth.middleware";
import { getOrganizerByFaceitIdAndGameAppId } from "../../models/organizer.models";

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

// championship_cancelled, championship_checkin, championship_created, championship_finished, championship_seeding, championship_started,
type FaceITWebhookData =
  | MatchStatusConfiguringWebhook
  | MatchStatusReadyWebhook
  | MatchStatusAbortedWebhook
  | MatchStatusCancelledWebhook
  | MatchDemoReadyWebhook
  | MatchStatusFinishedWebhook
  | MatchStatusFinishedAfterAbortWebhook
  | MatchObjectCreatedWebhook
  | ChampionshipCreatedWebhook
  | {
      app_id: string;
      event:
        | "championship_cancelled"
        | "championship_checkin"
        | "championship_finished"
        | "championship_seeding"
        | "championship_started";
      payload: { id: string; organizer_id: string };
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
    if (error instanceof ZodError) {
      logger.error("Zod validation error", error);
      await saveWebhookData(
        externalMatchRoomId,
        String((webhookData as any).event),
        JSON.stringify(webhookData),
        JSON.stringify(matchDetails),
        "ZOD_VALIDATION_ERROR",
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
    const appId = convertFaceitGameToAppId(webhookData.app_id);
    const organizer = await getOrganizerByFaceitIdAndGameAppId(
      webhookData.payload.organizer_id,
      appId
    );

    if (!organizer) {
      logger.error(
        `Organizer not found for faceit_id ${webhookData.payload.organizer_id} and app_id ${appId}`
      );
      // TODO: Handle this when we go live
      // res.status(404).send("Organizer not found");
      // return;
    }

    if (webhookData.event === "match_object_created") {
      if (webhookData.payload.entity.type === "matchmaking") {
        const {
          webhookData: validatedWebhook,
          matchDetails: validatedMatchDetails
        } = await processWebhookWithDetails(
          webhookData,
          validateMatchObjectCreatedWebhook,
          getFaceITMatchDetails<MatchmakingDetailsObjectCreated>,
          validateMatchmakingDetailsObjectCreated,
          webhookData.event
        );
      }
      if (webhookData.payload.entity.type === "championship") {
        const {
          webhookData: validatedWebhook,
          matchDetails: validatedMatchDetails
        } = await processWebhookWithDetails(
          webhookData,
          validateMatchObjectCreatedWebhook,
          getFaceITMatchDetails<ChampionshipDetailsObjectCreated>,
          validateChampionshipDetailsObjectCreated,
          webhookData.event
        );
        await addMatchToDatabase(
          validatedMatchDetails,
          validatedWebhook.payload.entity.id
        );
      }
      res.status(200).send("Webhook received");
      return;
    }

    if (webhookData.event === "match_status_configuring") {
      // Get map vetos and bans here
      if (webhookData.payload.entity.type === "matchmaking") {
        const {
          webhookData: validatedWebhook,
          matchDetails: validatedMatchDetails
        } = await processWebhookWithDetails(
          webhookData,
          validateMatchStatusConfiguringWebhook,
          getFaceITMatchDetails<MatchmakingDetailsConfiguring>,
          validateMatchmakingDetailsConfiguring,
          webhookData.event
        );
      }
      if (webhookData.payload.entity.type === "championship") {
        const {
          webhookData: validatedWebhook,
          matchDetails: validatedMatchDetails
        } = await processWebhookWithDetails(
          webhookData,
          validateMatchStatusConfiguringWebhook,
          getFaceITMatchDetails<ChampionshipDetailsConfiguring>,
          validateChampionshipDetailsConfiguring,
          webhookData.event
        );
      }
      res.status(200).send("Webhook received");
      return;
    }

    if (webhookData.event === "match_status_ready") {
      if (webhookData.payload.entity.type === "matchmaking") {
        const {
          webhookData: validatedWebhook,
          matchDetails: validatedMatchDetails
        } = await processWebhookWithDetails(
          webhookData,
          validateMatchStatusReadyWebhook,
          getFaceITMatchDetails<MatchmakingDetailsReady>,
          validateMatchmakingDetailsReady,
          webhookData.event
        );
      }
      if (webhookData.payload.entity.type === "championship") {
        const {
          webhookData: validatedWebhook,
          matchDetails: validatedMatchDetails
        } = await processWebhookWithDetails(
          webhookData,
          validateMatchStatusReadyWebhook,
          getFaceITMatchDetails<ChampionshipDetailsReady>,
          validateChampionshipDetailsReady,
          webhookData.event
        );
      }
      res.status(200).send("Webhook received");
      return;
    }

    // This should be ok now, but ensure this happens for Match, not MatchGame.
    if (webhookData.event === "match_status_finished") {
      if (validateMatchStatusFinishedWebhook(webhookData)) {
        const externalMatchRoomId = webhookData.payload.id;
        const matchDetails = await getFaceITMatchDetails(externalMatchRoomId);
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
            webhookData.event,
            JSON.stringify(webhookData),
            JSON.stringify(matchDetails)
          );
        }

        const endTime = webhookData.payload.finished_at;
        await updateMatchFinished(webhookData.payload.id, startTime, endTime);
        await saveWebhookData(
          externalMatchRoomId,
          webhookData.event,
          JSON.stringify(webhookData),
          JSON.stringify(matchDetails)
        );
      }
      res.status(200).send("Webhook received");
      return;
    }

    if (webhookData.event === "match_demo_ready") {
      // Validate players in both teams and push the demo url to parser
      // Send demo_url to parser
      const matchDetails = await getFaceITMatchDetails(webhookData.payload.id);
      await saveWebhookData(
        webhookData.payload.id,
        webhookData.event,
        JSON.stringify(webhookData),
        JSON.stringify(matchDetails)
      );
      res.status(200).send("Webhook received");
      return;
    }
    if (webhookData.event === "match_status_aborted") {
      // Do we need this?
      const matchDetails = await getFaceITMatchDetails(webhookData.payload.id);
      await saveWebhookData(
        webhookData.payload.id,
        webhookData.event,
        JSON.stringify(webhookData),
        JSON.stringify(matchDetails)
      );
      res.status(200).send("Webhook received");
      return;
    }

    if (webhookData.event === "match_status_cancelled") {
      const matchDetails = await getFaceITMatchDetails(webhookData.payload.id);
      await saveWebhookData(
        webhookData.payload.id,
        webhookData.event,
        JSON.stringify(webhookData),
        JSON.stringify(matchDetails)
      );
      res.status(200).send("Webhook received");
      return;
    }

    const championshipDetails = await getFaceITChampionshipDetails(
      webhookData.payload.id
    );

    await saveWebhookData(
      webhookData.payload.id,
      webhookData.event,
      JSON.stringify(webhookData),
      JSON.stringify(championshipDetails)
    );

    res.status(200).send("Webhook received");
    return;
  }
);

export default router;
