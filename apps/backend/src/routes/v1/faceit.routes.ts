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
import {
  saveWebhookData,
  updateErrorForWebhook
} from "../../models/faceit.models";
import { logger } from "../../utils/app-logger";
import {
  type MatchStatusReadyWebhook,
  type MatchStatusConfiguringWebhook,
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
  type RequestWithQueryAndBody,
  type MatchmakingDetailsFinished,
  validateMatchmakingDetailsFinished
} from "@eggosystem/types";
import {
  addMatchToDatabase,
  getMatchesByExternalId,
  getHubMatchesByExternalMatchRoomId,
  updateMatchEndTime,
  updateMatchEndTimestamp,
  updateMatchFinished,
  updateMatchStartTimestamp,
  updateMatchStatusByExternalMatchroomId,
  updateMatchStatusByMatchId,
  updateMatchStartAndEndTimestamp,
  getMatchesStatusByExternalMatchroomId
} from "../../models/match.models";
import { getMatchGamesByExternalMatchRoomId } from "../../models/match-game.models";
import { createApiKeyValidator } from "../../middlewares/api-key-auth.middleware";
import {
  getOrganizerByFaceitIdAndGameAppId,
  getOrganizerFaceitActiveSeasonForApp
} from "../../models/organizer.models";
import { NotFoundError } from "../../utils/errors";
import { addMatchTeamMapVetoes } from "../../models/match-team-map-veto.models";
import { addFaceitMatchGameToDatabase } from "../../services/faceit.services";
import { validatePlayersInTeams } from "../../models/season-team-players.models";
import { addChampionshipToDatabase } from "../../services/season-league-external-id.services";
import {
  getSeasonLeagueExternalIdByExternalIdWithSeasonSettings,
  removeSeasonLeagueExternalId
} from "../../models/season-league-external-id.models";
import {
  triggerFaceitMatchSync,
  validateChampionshipTeamsController,
  getFaceitPlayerController
} from "../../controllers/faceit.controllers";
import { sendDemoForAllStarPOTGClip } from "../../services/allstar.services";
import { publishDemoProcessingRequest } from "../../services/match-game.services";
import { validateNumericParams } from "../../middlewares/validate-numeric-params";
import { getConnection } from "../../db/mysqlConnection";
import { parseFaceitDemoUrl } from "../../utils/faceit-demo-url-parser";

const router = Router();

router.post(
  "/sync/season/:season_id",
  validateNumericParams(),
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
  authenticateJWT,
  validateChampionshipTeamsController
);

router.get("/players/:steam_id", getFaceitPlayerController);

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let externalMatchRoomId = (webhookData as any)?.payload?.id as string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error?.name === "ZodError") {
      logger.error("Zod validation error", error);
      await saveWebhookData(
        externalMatchRoomId,
        retryCount,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        String((webhookData as any)?.event),
        webhookData,
        matchDetails,
        manualReprocess,
        "ZOD_VALIDATION_ERROR",
        error
      );
      throw error;
    }
    logger.error("Error handling webhook", error);
    await saveWebhookData(
      externalMatchRoomId,
      retryCount,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      String((webhookData as any)?.event),
      webhookData,
      matchDetails,
      manualReprocess,
      "UNKNOWN_ERROR",
      error
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
    logger.info(`[FaceIT Webhook] Reprocess: ${manualReprocess}`);

    if (!organizer) {
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

        if (validatedMatchDetails.group === 3) {
          if (!organizer.faceit_id) {
            logger.error(
              `Organizer ${organizer.name} has no faceit_id, skipping match ${validatedMatchDetails.match_id}`
            );
            res.status(400).send("Organizer has no faceit_id");
            return;
          }
          const organizerActiveSeason =
            await getOrganizerFaceitActiveSeasonForApp(
              organizer.faceit_id,
              appId
            );
          if (
            organizerActiveSeason?.grand_final_round_one_only &&
            validatedMatchDetails.round !== 1
          ) {
            logger.info(
              `Grand final round one only, skipping match ${validatedMatchDetails.match_id}`
            );
            res.status(200).send("Webhook received");
            return;
          }
        }
        const externalMatchRoomId = validatedWebhook.payload.id;

        try {
          await addMatchToDatabase(
            validatedMatchDetails,
            validatedWebhook.payload.entity.id
          );
        } catch (error) {
          logger.error(
            `Error adding match to database for external match room id ${externalMatchRoomId}: ${error}`
          );
          await updateErrorForWebhook(
            externalMatchRoomId,
            "UNKNOWN_ERROR",
            error
          ).catch(() => {
            logger.error(
              `Error updating error for webhook for external match room id ${externalMatchRoomId}: ${error}`
            );
          });
          throw error;
        }

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

        if (validateMatchStatusConfiguringWebhook(webhookData)) {
          const externalMatchRoomId = webhookData.payload.id;
          const matchByExternalMatchRoomId =
            await getMatchesByExternalId(externalMatchRoomId);
          if (
            matchByExternalMatchRoomId.some(
              (match) => match.status === MatchStatus.FORFEIT
            )
          ) {
            // The match was restarted, so we need to update the status to ONGOING
            await updateMatchStatusByExternalMatchroomId(
              externalMatchRoomId,
              "ONGOING"
            );
          }
        }

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
        await updateMatchStatusByExternalMatchroomId(
          validatedWebhook.payload.id,
          "ONGOING"
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

        await updateMatchStatusByExternalMatchroomId(
          validatedWebhook.payload.id,
          "ONGOING"
        );

        res.status(200).send("Webhook received");
        return;
      }
    }

    // This happens for our Matches table once, even if BO3
    if (webhookData.event === "match_status_finished") {
      if (webhookData.payload.entity.type === "matchmaking") {
        const {
          webhookData: validatedWebhook,
          matchDetails: validatedMatchDetails
        } = await processWebhookWithDetails(
          webhookData,
          validateMatchStatusFinishedWebhook,
          getFaceITMatchDetails<MatchmakingDetailsFinished>,
          validateMatchmakingDetailsFinished,
          webhookData.event,
          manualReprocess
        );
        res.status(200).send("Webhook received");
        return;
      }
      if (webhookData.payload.entity.type === "championship") {
        if (validateMatchStatusFinishedWebhook(webhookData)) {
          const externalMatchRoomId = webhookData.payload.id;
          const matchDetails = await getFaceITMatchDetails(externalMatchRoomId);
          const startTime = webhookData.payload.started_at;

          if (
            // Match was aborted due to AFK or forfeit.
            startTime === "1970-01-01T00:00:00Z" &&
            validateMatchStatusFinishedAfterAbortWebhook(webhookData)
          ) {
            logger.info(
              `Match ${externalMatchRoomId} was aborted due to AFK? ${startTime}`
            );

            // If any of the matches in the external match room is finished at any point, we do not want to update it to forfeit.
            const existingMatchStatus =
              await getMatchesStatusByExternalMatchroomId(externalMatchRoomId);
            if (existingMatchStatus.includes("FINISHED")) {
              logger.info(
                `Match ${externalMatchRoomId} is already finished, skipping`
              );
              res.status(200).send("Webhook received");
              return;
            }

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
            await updateMatchStatusByExternalMatchroomId(
              externalMatchRoomId,
              "FORFEIT"
            );
            res.status(200).send("Webhook received");
            return;
          }

          const endTime = webhookData.payload.finished_at;
          const externalLeagueId = webhookData.payload.entity.id;
          const seasonLeague =
            await getSeasonLeagueExternalIdByExternalIdWithSeasonSettings(
              externalLeagueId
            );
          const matchesByRoom =
            await getMatchesByExternalId(externalMatchRoomId);

          if (
            seasonLeague?.is_round_robin_bo2_as_2xbo1 &&
            matchesByRoom.length === 2
          ) {
            // 2xBO1: only update second game end time; first game already set at first match_demo_ready
            // For some reason the start time will be the second games start time in 1xBO2 in faceit, no idea why.
            await updateMatchStartAndEndTimestamp(
              matchesByRoom[1].id,
              startTime,
              endTime
            );
          } else {
            await updateMatchFinished(
              webhookData.payload.id,
              startTime,
              endTime
            );
          }
          await saveWebhookData(
            externalMatchRoomId,
            webhookData.retry_count,
            webhookData.event,
            webhookData,
            matchDetails,
            manualReprocess
          );
          await updateMatchStatusByExternalMatchroomId(
            externalMatchRoomId,
            "FINISHED"
          );
          res.status(200).send("Webhook received");
          return;
        }
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

        const externalLeagueId = webhookData.payload.entity.id;
        const seasonLeague =
          await getSeasonLeagueExternalIdByExternalIdWithSeasonSettings(
            externalLeagueId
          );
        if (!seasonLeague) {
          throw new Error(
            `No SeasonLeagueExternalId entry found when adding match games for external_id: ${externalLeagueId}`
          );
        }
        // Validate players in both teams that all the steam_ids are in the SeasonTeamPlayers table
        await validatePlayersInTeams(
          seasonLeague.season_id,
          validatedMatchDetails.teams,
          validatedMatchDetails.match_id
        );

        const matchGameId = await addFaceitMatchGameToDatabase(
          validatedWebhook,
          validatedMatchDetails,
          seasonLeague.is_round_robin_bo2_as_2xbo1
        );
        await Promise.all([
          sendDemoForAllStarPOTGClip(matchGameId, webhookData.payload.demo_url),
          publishDemoProcessingRequest(
            matchGameId,
            webhookData.payload.demo_url,
            "faceit",
            manualReprocess
          )
        ]);

        // 2xBO1: first game end = when first demo is ready; second game start = same time
        if (seasonLeague.is_round_robin_bo2_as_2xbo1) {
          const connection = await getConnection();
          try {
            await connection.beginTransaction();
            const hubMatches = await getHubMatchesByExternalMatchRoomId(
              validatedWebhook.payload.id,
              connection
            );

            if (!hubMatches || hubMatches.length !== 2) {
              throw new Error(
                `Expected 2 hub matches for 2xBO1, got ${hubMatches?.length}`
              );
            }

            const demoUrl = validatedWebhook.payload.demo_url;
            const parsedDemoUrl = parseFaceitDemoUrl(demoUrl);
            if (!parsedDemoUrl) {
              throw new Error(`Invalid faceit demo url: ${demoUrl}`);
            }
            const { mapNumber } = parsedDemoUrl;
            const firstGameEndTime = validatedWebhook.payload.updated_at;

            // Assuming first game is the first match in the hub
            const matchIndex = mapNumber - 1;
            await updateMatchEndTimestamp(
              hubMatches[matchIndex].id,
              firstGameEndTime,
              connection
            );

            await updateMatchStatusByMatchId(
              hubMatches[matchIndex].id,
              "FINISHED",
              connection
            );

            // Start the second game at the same time as the first game ended
            if (mapNumber === 1) {
              await updateMatchStartTimestamp(
                hubMatches[1].id,
                firstGameEndTime,
                connection
              );
            }
            await connection.commit();
          } catch (error) {
            logger.error(
              `Error updating match status for match ${validatedWebhook.payload.id}: ${error}`
            );
            await connection.rollback();
            throw error;
          } finally {
            connection.release();
          }
        }

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
      await updateMatchStatusByExternalMatchroomId(
        webhookData.payload.id,
        "ABORTED"
      );
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
      await updateMatchStatusByExternalMatchroomId(
        webhookData.payload.id,
        "CANCELLED"
      );
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
