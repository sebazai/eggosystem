import { type Response, type NextFunction } from "express";
import {
  getFaceITMatchDetails,
  getFaceITChampionshipDetails,
  addFaceitMatchGameToDatabase
} from "../services/faceit.services";
import {
  getMatchStatusFinishedCountAfterLastConfiguring,
  saveWebhookData,
  updateErrorForWebhook
} from "../models/faceit.models";
import { invalidateChampionshipMatchesCache } from "../services/playoff-bracket.services";
import { invalidateChampionshipBracketMatchesCache } from "../services/faceit-bracket.services";
import { isForfeitPayload } from "../utils/faceit-match-status-finished-detection";
import { logger } from "../utils/app-logger";
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
  validateMatchmakingDetailsFinished,
  type ChampionshipDetailsFinished
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
  getMatchesStatusByExternalMatchroomId
} from "../models/match.models";
import { hasMatchGameWithDemo } from "../models/match-game.models";
import {
  resolveRoundRobinBo2SplitFromFaceitWithVetoCheck,
  applyRoundRobinBo2SplitDecisions
} from "../services/faceit-2xbo1-resolver.services";
import {
  getOrganizerByFaceitIdAndGameAppId,
  getOrganizerFaceitSeasonForApp
} from "../models/organizer.models";
import { NotFoundError } from "../utils/errors";
import { addMatchTeamMapVetoes } from "../models/match-team-map-veto.models";
import { validatePlayersInTeams } from "../models/season-team-players.models";
import {
  addChampionshipToDatabase,
  extractSeasonHintFromName
} from "../services/season-league-external-id.services";
import {
  getSeasonLeagueExternalIdByExternalIdWithSeasonSettings,
  removeSeasonLeagueExternalId
} from "../models/season-league-external-id.models";
import { convertFaceitGameToAppId } from "../services/faceit.services";
import { sendDemoForAllStarPOTGClip } from "../services/allstar.services";
import { publishDemoProcessingRequest } from "../services/match-game.services";
import { getConnection } from "../db/mysqlConnection";
import { parseFaceitDemoUrl } from "../utils/faceit-demo-url-parser";

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
    const validatedWebhook = webhookValidator(webhookData);
    externalMatchRoomId = validatedWebhook.payload.id;

    matchDetails = await getDetailsFunction(externalMatchRoomId);
    const validatedMatchDetails = detailsValidator(matchDetails);

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

export const handleFaceitWebhook = async (
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
      await processWebhookWithDetails(
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

        const leagueNameWithSeason = validatedWebhook.payload.entity.name;
        const seasonHint = extractSeasonHintFromName(leagueNameWithSeason);
        const organizerActiveSeason = await getOrganizerFaceitSeasonForApp(
          organizer.faceit_id,
          seasonHint,
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
        await invalidateChampionshipMatchesCache(
          validatedWebhook.payload.entity.id
        );
        await invalidateChampionshipBracketMatchesCache(
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
      await processWebhookWithDetails(
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
      const { webhookData: validatedWebhook } = await processWebhookWithDetails(
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

      await invalidateChampionshipMatchesCache(
        validatedWebhook.payload.entity.id
      );
      await invalidateChampionshipBracketMatchesCache(
        validatedWebhook.payload.entity.id
      );

      res.status(200).send("Webhook received");
      return;
    }
  }

  if (webhookData.event === "match_status_ready") {
    if (webhookData.payload.entity.type === "matchmaking") {
      const { webhookData: validatedWebhook } = await processWebhookWithDetails(
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

      // Only set matches to ONGOING if not already FINISHED (e.g. 2xBO1 first game with demo)
      const matchesByRoom = await getMatchesByExternalId(
        validatedWebhook.payload.id
      );
      for (const match of matchesByRoom) {
        if (match.status !== "FINISHED") {
          await updateMatchStatusByMatchId(match.id, "ONGOING");
        }
      }

      await invalidateChampionshipMatchesCache(
        validatedWebhook.payload.entity.id
      );
      await invalidateChampionshipBracketMatchesCache(
        validatedWebhook.payload.entity.id
      );

      res.status(200).send("Webhook received");
      return;
    }
  }

  // This happens for our Matches table once, even if BO3
  if (webhookData.event === "match_status_finished") {
    if (webhookData.payload.entity.type === "matchmaking") {
      await processWebhookWithDetails(
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
        const matchDetails =
          await getFaceITMatchDetails<ChampionshipDetailsFinished>(
            externalMatchRoomId
          );
        const detailedResults = matchDetails?.detailed_results;
        const startTime = webhookData.payload.started_at;
        const externalLeagueId = webhookData.payload.entity.id;

        if (
          isForfeitPayload(webhookData.payload) &&
          validateMatchStatusFinishedAfterAbortWebhook(webhookData)
        ) {
          logger.info(
            `Match ${externalMatchRoomId} was aborted due to AFK? ${startTime}`
          );

          const endTime = webhookData.payload.finished_at;
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
            const diagnosticGameIndex =
              await getMatchStatusFinishedCountAfterLastConfiguring(
                externalMatchRoomId
              );
            const siblingDemoState = await Promise.all(
              matchesByRoom.map(async (sibling) => ({
                matchId: sibling.id,
                hasDemo: await hasMatchGameWithDemo(sibling.id)
              }))
            );
            logger.info(
              `[2xBO1 forfeit] room=${externalMatchRoomId} diagnostic gameIndex=${diagnosticGameIndex} ` +
                `slot statuses=[${matchesByRoom
                  .map((m) => `${m.id}:${m.status}`)
                  .join(",")}] demo=[${siblingDemoState
                  .map((s) => `${s.matchId}:${s.hasDemo}`)
                  .join(",")}]`
            );
            const decisions =
              await resolveRoundRobinBo2SplitFromFaceitWithVetoCheck({
                externalMatchRoomId,
                matchesByRoom,
                webhookPayload: webhookData.payload,
                isForfeitWebhook: true,
                faceitMatchDetails: matchDetails,
                siblingDemoState,
                detailedResults
              });
            const connection = await getConnection();
            try {
              await connection.beginTransaction();
              await applyRoundRobinBo2SplitDecisions(
                decisions,
                connection,
                externalMatchRoomId
              );
              await connection.commit();
            } catch (error) {
              await connection.rollback();
              throw error;
            } finally {
              connection.release();
            }
          } else {
            const existingMatchStatus =
              await getMatchesStatusByExternalMatchroomId(externalMatchRoomId);
            if (existingMatchStatus.includes("FINISHED")) {
              logger.info(
                `Match ${externalMatchRoomId} is already finished, skipping`
              );
              res.status(200).send("Webhook received");
              return;
            }
            await updateMatchEndTime(webhookData.payload.id, endTime);
            await updateMatchStatusByExternalMatchroomId(
              externalMatchRoomId,
              "FORFEIT"
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
          await invalidateChampionshipMatchesCache(externalLeagueId);
          await invalidateChampionshipBracketMatchesCache(externalLeagueId);
          res.status(200).send("Webhook received");
          return;
        }

        const endTime = webhookData.payload.finished_at;
        const seasonLeague =
          await getSeasonLeagueExternalIdByExternalIdWithSeasonSettings(
            externalLeagueId
          );
        const matchesByRoom = await getMatchesByExternalId(externalMatchRoomId);

        if (
          seasonLeague?.is_round_robin_bo2_as_2xbo1 &&
          matchesByRoom.length === 2
        ) {
          const diagnosticGameIndex =
            await getMatchStatusFinishedCountAfterLastConfiguring(
              externalMatchRoomId
            );
          const siblingDemoState = await Promise.all(
            matchesByRoom.map(async (sibling) => ({
              matchId: sibling.id,
              hasDemo: await hasMatchGameWithDemo(sibling.id)
            }))
          );
          logger.info(
            `[2xBO1 finished] room=${externalMatchRoomId} diagnostic gameIndex=${diagnosticGameIndex} ` +
              `slot statuses=[${matchesByRoom
                .map((m) => `${m.id}:${m.status}`)
                .join(",")}] demo=[${siblingDemoState
                .map((s) => `${s.matchId}:${s.hasDemo}`)
                .join(",")}]`
          );
          const decisions =
            await resolveRoundRobinBo2SplitFromFaceitWithVetoCheck({
              externalMatchRoomId,
              matchesByRoom,
              webhookPayload: webhookData.payload,
              isForfeitWebhook: false,
              faceitMatchDetails: matchDetails,
              siblingDemoState,
              detailedResults
            });
          const connection = await getConnection();
          try {
            await connection.beginTransaction();
            await applyRoundRobinBo2SplitDecisions(
              decisions,
              connection,
              externalMatchRoomId
            );
            await connection.commit();
          } catch (error) {
            await connection.rollback();
            throw error;
          } finally {
            connection.release();
          }
        } else {
          await updateMatchFinished(webhookData.payload.id, startTime, endTime);
          await updateMatchStatusByExternalMatchroomId(
            externalMatchRoomId,
            "FINISHED"
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
        await invalidateChampionshipMatchesCache(externalLeagueId);
        await invalidateChampionshipBracketMatchesCache(externalLeagueId);
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
      await processWebhookWithDetails(
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
      await validatePlayersInTeams(
        seasonLeague.season_id,
        validatedMatchDetails.teams,
        validatedMatchDetails.match_id
      );

      // 2xBO1: validate map number then set match to FINISHED when demo is ready (before adding MatchGame)
      // Only applies when FaceIT reports best_of === 2; playoff BO3 matches in the same season must be allowed through
      if (
        seasonLeague.is_round_robin_bo2_as_2xbo1 &&
        validatedMatchDetails.best_of === 2
      ) {
        const demoUrl = validatedWebhook.payload.demo_url;
        const parsedDemoUrl = parseFaceitDemoUrl(demoUrl);
        if (!parsedDemoUrl) {
          throw new Error(`Invalid faceit demo url: ${demoUrl}`);
        }
        const { mapNumber } = parsedDemoUrl;
        if (mapNumber < 1 || mapNumber > 2) {
          throw new Error(
            `2xBO1 demo url must have map number 1 or 2, got ${mapNumber}: ${demoUrl}`
          );
        }

        const connection = await getConnection();
        try {
          await connection.beginTransaction();
          const hubMatches = await getHubMatchesByExternalMatchRoomId(
            validatedWebhook.payload.id,
            connection
          );

          if (hubMatches && hubMatches.length === 2) {
            const firstGameEndTime = validatedWebhook.payload.updated_at;
            const matchIndex = mapNumber - 1;
            await updateMatchEndTimestamp(
              hubMatches[matchIndex].id,
              firstGameEndTime,
              connection
            );
            if (hubMatches[matchIndex].status !== MatchStatus.FORFEIT) {
              await updateMatchStatusByMatchId(
                hubMatches[matchIndex].id,
                "FINISHED",
                connection
              );
            }
            if (mapNumber === 1) {
              await updateMatchStartTimestamp(
                hubMatches[1].id,
                firstGameEndTime,
                connection
              );
            }
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

      res.status(200).send("Webhook received");
      return;
    }
  }

  if (webhookData.event === "match_status_aborted") {
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
    const { webhookData: validatedWebhook } = await processWebhookWithDetails(
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
    await processWebhookWithDetails(
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
    await processWebhookWithDetails(
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
    const { webhookData: validatedWebhook } = await processWebhookWithDetails(
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
};
