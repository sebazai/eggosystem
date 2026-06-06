import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { checkPermissions } from "../../../middlewares/auth.middleware";
import {
  getFailedParseMessages,
  getFailedParseMessagesCount,
  getFailedParseMessageById,
  reparseFailedMessages,
  getFailedParseMessagesStats,
  requeue2ddataFailedMessages
} from "../../../models/failed-parse.models";
import {
  getMatchGameDemofileById,
  getMatchGameByMatchIdAndMapOrder
} from "../../../models/match-game.models";
import type { ReparseRequest } from "@eggosystem/types";
import type { Requeue2ddataRequest } from "@eggosystem/types";
import {
  NotFoundError,
  BadRequestError,
  UnauthorizedError
} from "../../../utils/errors";
import { logger } from "../../../utils/app-logger";
import { enqueueManualDashboardDemoParse } from "../../../services/manual-demo-parse.services";
import { replayGrandFinalPlacements } from "../../../services/replay-grand-final-placements.services";
import {
  resolveOrCreateMatchGameIdForDemoUrl,
  resolveOrCreateMatchGameIdForHubMatchDemo
} from "../../../services/faceit-match.services";
import { getHubMatchesByExternalMatchRoomId } from "../../../models/match.models";
import { enqueueFailedParseBackgroundJob } from "../../../services/failed-parse-background-queue.services";
import { attachFailedParseJobSse } from "../../../services/failed-parse-sse.services";

const router = Router();

const httpsUrlSchema = z
  .string()
  .min(1)
  .refine((val) => {
    try {
      return new URL(val).protocol === "https:";
    } catch {
      return false;
    }
  }, "Demo download URL must be a valid HTTPS URL");

const manualParseQueueBodySchema = z
  .object({
    match_game_id: z.coerce.number().int().positive().optional(),
    match_id: z.coerce.number().int().positive().optional(),
    map_order: z.coerce.number().int().min(1).optional(),
    external_match_room_id: z.string().min(1).optional(),
    /**
     * Demo download URL (HTTPS). Optional when `reparse` is true and the
     * identifier is `match_game_id` or `match_id`+`map_order` — the backend
     * will use the `demofile` already stored on the MatchGame row.
     * Required when `external_match_room_id` is used (no pre-existing MatchGame
     * to fall back on in all cases).
     */
    download_url: httpsUrlSchema.optional(),
    priority: z.number().int().min(1).max(10).optional().default(5),
    reparse: z.boolean().optional().default(false),
    /**
     * When true, enqueue then mark associated `Matches` FINISHED using
     * `start_timestamp + best_of` hours per approved architecture (#379).
     */
    mark_finished: z.boolean().optional().default(false),
    force_finish_forfeit: z.boolean().optional().default(false)
  })
  .superRefine((val, ctx) => {
    const hasAny =
      val.match_game_id != null ||
      val.match_id != null ||
      val.external_match_room_id;
    if (!hasAny) {
      ctx.addIssue({
        code: "custom",
        message:
          "Either match_game_id, match_id, or external_match_room_id must be provided",
        path: ["match_game_id"]
      });
    }
    const count =
      (val.match_game_id != null ? 1 : 0) +
      (val.match_id != null ? 1 : 0) +
      (val.external_match_room_id ? 1 : 0);
    if (count > 1) {
      ctx.addIssue({
        code: "custom",
        message:
          "Provide only one of match_game_id, match_id, or external_match_room_id",
        path: ["external_match_room_id"]
      });
    }

    // If we're creating/inferring a MatchGame from an internal hub match id,
    // require the caller to specify which map in the series this demo belongs to.
    if (val.match_id != null && val.map_order == null) {
      ctx.addIssue({
        code: "custom",
        message: "map_order is required when match_id is provided",
        path: ["map_order"]
      });
    }

    // download_url is required when using external_match_room_id (no stored
    // demofile to fall back on in all cases), or when not reparsing.
    if (!val.download_url) {
      if (val.external_match_room_id) {
        ctx.addIssue({
          code: "custom",
          message:
            "download_url is required when external_match_room_id is provided",
          path: ["download_url"]
        });
      } else if (!val.reparse) {
        ctx.addIssue({
          code: "custom",
          message:
            "download_url is required unless reparse is true (omit URL to reuse the stored demofile)",
          path: ["download_url"]
        });
      }
    }
  });

// Query parameter schema for listing failed messages
const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  queue_name: z.string().optional(),
  status: z.string().optional()
});

// Schema for reparse request
const reparseRequestSchema = z.object({
  match_game_ids: z.array(z.number().int().positive()).min(1).max(50),
  priority: z.number().int().min(1).max(10).optional().default(5)
});

const replayGrandFinalPlacementsBodySchema = z
  .object({
    external_match_room_id: z.string().min(1).optional(),
    match_id: z.coerce.number().int().positive().optional(),
    season_id: z.coerce.number().int().positive().optional(),
    league_id: z.coerce.number().int().positive().optional()
  })
  .superRefine((val, ctx) => {
    const hasMatchId = val.match_id != null;
    const hasExternalRoomId = val.external_match_room_id != null;
    const hasSeasonLeague = val.season_id != null && val.league_id != null;
    const hasPartialSeasonLeague =
      (val.season_id != null) !== (val.league_id != null);

    if (hasPartialSeasonLeague) {
      ctx.addIssue({
        code: "custom",
        message: "season_id and league_id must be provided together",
        path: ["season_id"]
      });
    }

    const modeCount =
      (hasMatchId ? 1 : 0) +
      (hasExternalRoomId ? 1 : 0) +
      (hasSeasonLeague ? 1 : 0);

    if (modeCount === 0) {
      ctx.addIssue({
        code: "custom",
        message:
          "Provide match_id, external_match_room_id, or season_id and league_id",
        path: ["match_id"]
      });
    }
    if (modeCount > 1) {
      ctx.addIssue({
        code: "custom",
        message:
          "Provide only one of match_id, external_match_room_id, or season_id and league_id",
        path: ["external_match_room_id"]
      });
    }
  });

router.post(
  "/placements/replay-grand-final",
  async (req: Request, res: Response, next: NextFunction) => {
    const actorAccountId = req.auth?.account_id;
    if (actorAccountId === undefined) {
      return next(new UnauthorizedError("Not authenticated"));
    }

    const parsed = replayGrandFinalPlacementsBodySchema.safeParse(req.body);
    if (!parsed.success) {
      logger.warn("Replay grand-final placements body validation failed", {
        issues: parsed.error.flatten()
      });
      return next(parsed.error);
    }

    logger.info("Replay grand-final placements request", {
      actorAccountId,
      hasMatchId: parsed.data.match_id != null,
      hasExternalRoomId: parsed.data.external_match_room_id != null,
      hasSeasonLeague:
        parsed.data.season_id != null && parsed.data.league_id != null
    });

    const result = await replayGrandFinalPlacements(parsed.data);
    res.status(200).json(result);
  }
);

/**
 * POST /v1/dashboard/demos/manual/parse-queue
 * Staff-only: enqueue a manual HTTPS demo URL for a MatchGame on parse_queue (source manual/faceit).
 * Dashboard “repair” actions here use global staff role checks (e.g. admin, helpdesk via
 * `checkPermissions` on this mount), not a per-match or per-team scoping check.
 */
router.post(
  "/manual/parse-queue",
  async (req: Request, res: Response, next: NextFunction) => {
    const actorAccountId = req.auth?.account_id;
    if (actorAccountId === undefined) {
      return next(new UnauthorizedError("Not authenticated"));
    }

    const parsed = manualParseQueueBodySchema.safeParse(req.body);
    if (!parsed.success) {
      logger.warn("Manual parse-queue body validation failed", {
        issues: parsed.error.flatten()
      });
      return next(parsed.error);
    }

    const {
      download_url: rawDownloadUrl,
      priority,
      reparse,
      mark_finished,
      force_finish_forfeit,
      ...identifiers
    } = parsed.data;
    const { match_game_id, match_id, map_order, external_match_room_id } =
      identifiers;

    let matchGameId: number;
    let download_url: string;
    /** When set, finishes these internal Matches.id values (multi-row for external hub rows). */
    let finishMatchIds: number[] | undefined = undefined;
    const source = external_match_room_id ? "faceit" : "manual";
    if (match_game_id != null) {
      matchGameId = match_game_id;
      if (rawDownloadUrl) {
        download_url = rawDownloadUrl;
      } else {
        // Reparse without URL: use the demofile stored on the existing MatchGame.
        const stored = await getMatchGameDemofileById(match_game_id);
        if (!stored) {
          return next(
            new NotFoundError(
              `MatchGame ${match_game_id} has no stored demofile; provide download_url`
            )
          );
        }
        download_url = stored;
      }
    } else if (match_id != null) {
      if (rawDownloadUrl) {
        matchGameId = await resolveOrCreateMatchGameIdForHubMatchDemo({
          matchId: match_id,
          demoUrl: rawDownloadUrl,
          mapOrder: map_order
        });
        download_url = rawDownloadUrl;
      } else {
        // Reparse without URL: look up the existing MatchGame by match_id + map_order.
        const existing = await getMatchGameByMatchIdAndMapOrder(
          match_id,
          map_order!
        );
        if (!existing) {
          return next(
            new NotFoundError(
              `No MatchGame found for match_id=${match_id} map_order=${map_order}; provide download_url`
            )
          );
        }
        if (!existing.demofile) {
          return next(
            new NotFoundError(
              `MatchGame for match_id=${match_id} map_order=${map_order} has no stored demofile; provide download_url`
            )
          );
        }
        matchGameId = existing.id;
        download_url = existing.demofile;
      }
      finishMatchIds = [match_id];
    } else {
      if (!external_match_room_id) {
        return next(new BadRequestError("Missing match identifier"));
      }

      if (!rawDownloadUrl) {
        // Schema validation already rejects this case, guard for safety.
        return next(
          new BadRequestError(
            "download_url is required when external_match_room_id is provided"
          )
        );
      }
      download_url = rawDownloadUrl;

      // Mirror FACEIT `match_demo_ready` using provided external match room id + demo url.
      // Requires MatchTeamMapVetoes to exist for the hub match (same dependency as the webhook path).
      const hubMatches = await getHubMatchesByExternalMatchRoomId(
        external_match_room_id
      );
      if (!hubMatches || hubMatches.length === 0) {
        return next(
          new NotFoundError("No matches found for external_match_room_id")
        );
      }

      finishMatchIds = hubMatches.map((m) => m.id);

      matchGameId = await resolveOrCreateMatchGameIdForDemoUrl({
        externalMatchRoomId: external_match_room_id,
        demoUrl: download_url,
        isRoundRobinBo2As2xBo1: hubMatches.length === 2
      });
    }

    logger.info("Manual parse-queue enqueue request", {
      actorAccountId,
      matchGameId
    });

    const result = await enqueueManualDashboardDemoParse({
      matchGameId,
      downloadUrl: download_url,
      priority,
      actorAccountId,
      source,
      reparse,
      mark_finished,
      force_finish_forfeit,
      finishMatchIds
    });

    res.status(200).json({
      status: "enqueued",
      match_game_id: result.match_game_id,
      mark_finished: result.mark_finished,
      placements: result.placements
    });
  }
);

// Admin-only: failed-parse + requeue/reparse operations (more sensitive than manual uploads).
const failedParseRouter = Router();
router.use(
  "/failed/parse",
  checkPermissions({
    fallbackRoles: ["admin"]
  }),
  failedParseRouter
);

const requeue2ddataRequestSchema = z.object({
  items: z
    .array(
      z.object({
        match_game_id: z.string().min(1),
        demo_path: z.string().min(1)
      })
    )
    .min(1)
    .max(50)
});

const requeueAllRequestSchema = z.object({
  queue_name: z.string().min(1),
  priority: z.number().int().min(1).max(10).optional().default(5)
});

/**
 * GET /v1/dashboard/demos/failed/parse
 * List failed parse messages with pagination and filtering
 */
failedParseRouter.get(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    logger.info("GET /demos/failed/parse request", { query: req.query });

    // Validate query parameters
    const validationResult = listQuerySchema.safeParse(req.query);

    if (!validationResult.success) {
      logger.warn("Query validation failed", {
        error: validationResult.error
      });
      return next(
        new BadRequestError(
          "Invalid query parameters",
          400,
          "Validation Failed"
        )
      );
    }

    const { limit, offset, queue_name, status } = validationResult.data;

    // Get messages and total count in parallel
    const [messages, totalCount] = await Promise.all([
      getFailedParseMessages(limit, offset, queue_name, status),
      getFailedParseMessagesCount(queue_name, status)
    ]);

    // Return messages as-is (already formatted from RabbitMQ)
    const formattedMessages = messages.map((message) => ({
      ...message,
      // Remove internal RabbitMQ reference for frontend
      _rabbitMQMessage: undefined
    }));

    res.json({
      messages: formattedMessages,
      pagination: {
        total: totalCount,
        limit,
        offset,
        has_more: offset + limit < totalCount
      },
      filters: {
        queue_name,
        status
      }
    });
  }
);

/**
 * GET /v1/dashboard/demos/failed/parse/stats
 * Get statistics about failed parse messages
 */
failedParseRouter.get(
  "/stats",
  async (req: Request, res: Response, _next: NextFunction) => {
    const stats = await getFailedParseMessagesStats();

    res.json({
      stats
    });
  }
);

/**
 * GET /v1/dashboard/demos/failed/parse/events
 * Server-Sent Events stream for background failed-parse job progress (per authenticated user).
 * Must be registered before `/failed/parse/:id` so `events` is not captured as an id.
 */
failedParseRouter.get(
  "/events",
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.auth?.account_id;
    if (userId === undefined) {
      return next(new UnauthorizedError("Not authenticated"));
    }

    try {
      await attachFailedParseJobSse(req, res, userId);
    } catch (error) {
      return next(error);
    }
  }
);

/**
 * GET /v1/dashboard/demos/failed/parse/:id
 * Get a specific failed parse message by ID
 */
failedParseRouter.get(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return next(new BadRequestError("Invalid message ID"));
    }

    const message = await getFailedParseMessageById(id);

    if (!message) {
      return next(new NotFoundError("Failed parse message not found"));
    }

    // Return message as-is (already formatted from RabbitMQ)
    const formattedMessage = {
      ...message,
      // Remove internal RabbitMQ reference for frontend
      _rabbitMQMessage: undefined
    };

    res.json(formattedMessage);
  }
);

/**
 * POST /v1/dashboard/demos/failed/parse/reparse
 * Reparse selected failed messages
 */
failedParseRouter.post(
  "/reparse",
  async (req: Request, res: Response, next: NextFunction) => {
    logger.info("Reparse request received", { body: req.body });

    // Validate request body
    const validationResult = reparseRequestSchema.safeParse(req.body);

    if (!validationResult.success) {
      logger.warn("Reparse validation failed", {
        error: validationResult.error
      });
      return next(
        new BadRequestError("Invalid reparse request", 400, "Validation Failed")
      );
    }

    const reparseRequest: ReparseRequest = validationResult.data;

    if (reparseRequest.match_game_ids.length > 5) {
      const userId = req.auth?.account_id;
      if (userId === undefined) {
        return next(new UnauthorizedError("Not authenticated"));
      }

      const { jobId } = await enqueueFailedParseBackgroundJob({
        kind: "reparse",
        userId,
        body: reparseRequest
      });

      res.status(200).json({
        success: true,
        requeued_count: 0,
        failed_count: 0,
        queued: true,
        requested_count: reparseRequest.match_game_ids.length,
        job_id: jobId
      });
      return;
    }

    const result = await reparseFailedMessages(reparseRequest);

    // Return appropriate status code based on result
    const statusCode = result.success ? 200 : 400;

    res.status(statusCode).json(result);
  }
);

failedParseRouter.post(
  "/requeue-2ddata",
  async (req: Request, res: Response, next: NextFunction) => {
    logger.info("2ddata requeue request received", { body: req.body });

    const validationResult = requeue2ddataRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      logger.warn("2ddata requeue validation failed", {
        error: validationResult.error
      });
      return next(
        new BadRequestError(
          "Invalid 2ddata requeue request",
          400,
          "Validation Failed"
        )
      );
    }

    const request: Requeue2ddataRequest = validationResult.data;

    if (request.items.length > 5) {
      const userId = req.auth?.account_id;
      if (userId === undefined) {
        return next(new UnauthorizedError("Not authenticated"));
      }

      const { jobId } = await enqueueFailedParseBackgroundJob({
        kind: "requeue2ddata",
        userId,
        body: request
      });

      res.status(200).json({
        success: true,
        requeued_count: 0,
        failed_count: 0,
        queued: true,
        requested_count: request.items.length,
        job_id: jobId
      });
      return;
    }

    const result = await requeue2ddataFailedMessages(request);
    const statusCode = result.success ? 200 : 400;
    res.status(statusCode).json(result);
  }
);

failedParseRouter.post(
  "/requeue-all",
  async (req: Request, res: Response, next: NextFunction) => {
    logger.info("Requeue-all request received", { body: req.body });

    const validationResult = requeueAllRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      logger.warn("Requeue-all validation failed", {
        error: validationResult.error
      });
      return next(
        new BadRequestError(
          "Invalid requeue-all request",
          400,
          "Validation Failed"
        )
      );
    }

    const userId = req.auth?.account_id;
    if (userId === undefined) {
      return next(new UnauthorizedError("Not authenticated"));
    }

    const { jobId } = await enqueueFailedParseBackgroundJob({
      kind: "requeueAll",
      userId,
      body: validationResult.data
    });

    const result = {
      success: true,
      requeued_count: 0,
      failed_count: 0,
      queued: true,
      job_id: jobId
    };
    const statusCode = result.success ? 200 : 400;
    res.status(statusCode).json(result);
  }
);

export default router;
