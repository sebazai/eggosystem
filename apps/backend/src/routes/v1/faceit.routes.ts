/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Router } from "express";
import {
  getFaceITTeamDetails,
  getFaceITMatchDetails,
  getFaceITChampionshipDetails,
  convertFaceitGameToAppId
} from "../../services/faceit.services";
import { type Request, type Response, type NextFunction } from "express";
import {
  authenticateJWT,
  checkPermissions
} from "../../middlewares/auth.middleware";
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
  type MatchmakingDetailsReady,
  validateMatchDemoReadyWebhook,
  type MatchmakingDetailsDemoReady,
  validateMatchmakingDetailsDemoReady,
  validateChampionshipDetailsDemoReady,
  type ChampionshipDetailsDemoReady,
  MatchStatus,
  validateChampionshipCreatedWebhook,
  validateChampionshipFinishedWebhook,
  validateChampionshipStartedWebhook,
  validateChampionshipCancelledWebhook,
  type RequestWithQueryAndBody
} from "@eggosystem/types";
import {
  addMatchToDatabase,
  updateMatchEndTime,
  updateMatchFinished,
  updateMatchStatus
} from "../../models/match.models";
import { createApiKeyValidator } from "../../middlewares/api-key-auth.middleware";
import { getOrganizerByFaceitIdAndGameAppId } from "../../models/organizer.models";
import { NotFoundError } from "../../utils/errors";
import { addMatchTeamMapVetoes } from "../../models/match-team-map-veto.models";
import { addMatchGameToDatabaseAndProcessDemo } from "../../models/game.models";
import { validatePlayersInTeams } from "../../models/season-team-players.models";
import { addChampionshipToDatabase } from "../../services/season-league-external-id.services";
import { removeSeasonLeagueExternalId } from "../../models/season-league-external-id.models";
import { validateChampionshipTeamsController } from "../../controllers/faceit.controllers";
import { triggerFaceitMatchSync } from "../../controllers/faceit-sync.controllers";

const router = Router();

router.post(
  "/sync",
  authenticateJWT,
  checkPermissions({ fallbackRoles: ["admin", "helpdesk"] }),
  triggerFaceitMatchSync
);

router.get(
  "/teams/:faceit_team_id",
  authenticateJWT,
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await getFaceITTeamDetails(req.params.faceit_team_id);
    if (!data) {
      return next(
        new NotFoundError(
          `FaceIT team not found with id ${req.params.faceit_team_id}`
        )
      );
    }
    res.json(data);
  }
);

router.get(
  "/championship/:championship_id/validate",
  validateChampionshipTeamsController
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
      retry_count: number;
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
  eventType: string,
  manualReprocess: boolean
) => {
  let matchDetails: MD | null = null;
  let externalMatchRoomId = (webhookData as any)?.payload?.id as string;
  const retryCount = (webhookData as any)?.retry_count || 0;
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
      retryCount,
      eventType,
      validatedWebhook,
      validatedMatchDetails,
      manualReprocess
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
        retryCount,
        String((webhookData as any).event),
        webhookData,
        matchDetails,
        manualReprocess,
        "ZOD_VALIDATION_ERROR",
        JSON.stringify(error)
      );
      throw error;
    }
    logger.error("Error handling webhook", error);
    await saveWebhookData(
      externalMatchRoomId,
      retryCount,
      String((webhookData as any).event),
      webhookData,
      matchDetails,
      manualReprocess,
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
    req: RequestWithQueryAndBody<{ reprocess?: string }, FaceITWebhookData>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const webhookData = req.body;
    const appId = convertFaceitGameToAppId(webhookData.app_id);
    const organizer = await getOrganizerByFaceitIdAndGameAppId(
      webhookData.payload.organizer_id,
      appId
    );
    const manualReprocess = req.query.reprocess === "true";

    if (!organizer || organizer.length === 0) {
      logger.error(
        `Organizer not found for faceit_id ${webhookData.payload.organizer_id} and app_id ${appId}`
      );
      return next(new NotFoundError("Organizer not found"));
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
          webhookData.event,
          manualReprocess
        );
        res.status(200).send("Webhook received");
        return;
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
          webhookData.event,
          manualReprocess
        );

        await addMatchToDatabase(
          validatedMatchDetails,
          validatedWebhook.payload.entity.id
        );

        res.status(200).send("Webhook received");
        return;
      }
    }

    if (webhookData.event === "match_status_configuring") {
      if (webhookData.payload.entity.type === "matchmaking") {
        const {
          webhookData: validatedWebhook,
          matchDetails: validatedMatchDetails
        } = await processWebhookWithDetails(
          webhookData,
          validateMatchStatusConfiguringWebhook,
          getFaceITMatchDetails<MatchmakingDetailsConfiguring>,
          validateMatchmakingDetailsConfiguring,
          webhookData.event,
          manualReprocess
        );
        res.status(200).send("Webhook received");
        return;
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
          webhookData.event,
          manualReprocess
        );
        res.status(200).send("Webhook received");
        return;
      }
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
          webhookData.event,
          manualReprocess
        );
        await updateMatchStatus(
          validatedWebhook.payload.id,
          MatchStatus.ONGOING
        );
        res.status(200).send("Webhook received");
        return;
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
          webhookData.event,
          manualReprocess
        );

        await addMatchTeamMapVetoes(
          validatedMatchDetails,
          validatedWebhook.payload.entity.id
        );

        res.status(200).send("Webhook received");
        return;
      }
    }

    // This happens for our Matches table once, even if BO3
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
            webhookData.retry_count,
            webhookData.event,
            webhookData,
            matchDetails,
            manualReprocess
          );
          // TODO: Is MatchStatus.FINISHED the correct status?
          await updateMatchStatus(externalMatchRoomId, MatchStatus.ABORTED);
          res.status(200).send("Webhook received");
          return;
        }

        const endTime = webhookData.payload.finished_at;
        await updateMatchFinished(webhookData.payload.id, startTime, endTime);
        await saveWebhookData(
          externalMatchRoomId,
          webhookData.retry_count,
          webhookData.event,
          webhookData,
          matchDetails,
          manualReprocess
        );
        await updateMatchStatus(externalMatchRoomId, MatchStatus.FINISHED);
        res.status(200).send("Webhook received");
        return;
      }
    }

    // This is where we parse MatchGames
    if (webhookData.event === "match_demo_ready") {
      if (webhookData.payload.entity.type === "matchmaking") {
        const {
          webhookData: validatedWebhook,
          matchDetails: validatedMatchDetails
        } = await processWebhookWithDetails(
          webhookData,
          validateMatchDemoReadyWebhook,
          getFaceITMatchDetails<MatchmakingDetailsDemoReady>,
          validateMatchmakingDetailsDemoReady,
          webhookData.event,
          manualReprocess
        );
        res.status(200).send("Webhook received");
        return;
      }

      if (webhookData.payload.entity.type === "championship") {
        const {
          webhookData: validatedWebhook,
          matchDetails: validatedMatchDetails
        } = await processWebhookWithDetails(
          webhookData,
          validateMatchDemoReadyWebhook,
          getFaceITMatchDetails<ChampionshipDetailsDemoReady>,
          validateChampionshipDetailsDemoReady,
          webhookData.event,
          manualReprocess
        );
        // Validate players in both teams that all the steam_ids are in the SeasonTeamPlayers table
        await validatePlayersInTeams(
          validatedMatchDetails.teams,
          validatedMatchDetails.match_id
        );
        await addMatchGameToDatabaseAndProcessDemo(
          validatedWebhook,
          validatedMatchDetails,
          webhookData.payload.entity.id
        );

        res.status(200).send("Webhook received");
        return;
      }
    }
    if (webhookData.event === "match_status_aborted") {
      // Do we need this?
      const matchDetails = await getFaceITMatchDetails(webhookData.payload.id);
      await saveWebhookData(
        webhookData.payload.id,
        webhookData.retry_count,
        webhookData.event,
        webhookData,
        matchDetails,
        manualReprocess
      );
      await updateMatchStatus(webhookData.payload.id, MatchStatus.ABORTED);
      res.status(200).send("Webhook received");
      return;
    }

    if (webhookData.event === "match_status_cancelled") {
      const matchDetails = await getFaceITMatchDetails(webhookData.payload.id);
      await saveWebhookData(
        webhookData.payload.id,
        webhookData.retry_count,
        webhookData.event,
        webhookData,
        matchDetails,
        manualReprocess
      );
      await updateMatchStatus(webhookData.payload.id, MatchStatus.CANCELLED);
      res.status(200).send("Webhook received");
      return;
    }

    if (webhookData.event === "championship_created") {
      const {
        webhookData: validatedWebhook,
        matchDetails: validatedMatchDetails
      } = await processWebhookWithDetails(
        webhookData,
        validateChampionshipCreatedWebhook,
        getFaceITChampionshipDetails<unknown>,
        (data) => data,
        webhookData.event,
        manualReprocess
      );
      await addChampionshipToDatabase(validatedWebhook);
      res.status(200).send("Webhook received");
      return;
    }

    if (webhookData.event === "championship_started") {
      const {
        webhookData: validatedWebhook,
        matchDetails: validatedMatchDetails
      } = await processWebhookWithDetails(
        webhookData,
        validateChampionshipStartedWebhook,
        getFaceITChampionshipDetails<unknown>,
        (data) => data,
        webhookData.event,
        manualReprocess
      );
      res.status(200).send("Webhook received");
      return;
    }

    if (webhookData.event === "championship_finished") {
      const {
        webhookData: validatedWebhook,
        matchDetails: validatedMatchDetails
      } = await processWebhookWithDetails(
        webhookData,
        validateChampionshipFinishedWebhook,
        getFaceITChampionshipDetails<unknown>,
        (data) => data,
        webhookData.event,
        manualReprocess
      );
      res.status(200).send("Webhook received");
      return;
    }

    if (webhookData.event === "championship_cancelled") {
      const {
        webhookData: validatedWebhook,
        matchDetails: validatedMatchDetails
      } = await processWebhookWithDetails(
        webhookData,
        validateChampionshipCancelledWebhook,
        getFaceITChampionshipDetails<unknown>,
        (data) => data,
        webhookData.event,
        manualReprocess
      );
      await removeSeasonLeagueExternalId(validatedWebhook.payload.id);
      res.status(200).send("Webhook received");
      return;
    }

    await saveWebhookData(
      webhookData.payload.id,
      webhookData.retry_count,
      webhookData.event,
      webhookData,
      null,
      manualReprocess
    );

    res.status(200).send("Webhook received");
    return;
  }
);

export default router;
