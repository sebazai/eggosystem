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
import type { ReparseRequest } from "@eggosystem/types";
import type { Requeue2ddataRequest } from "@eggosystem/types";
import {
  NotFoundError,
  BadRequestError,
  UnauthorizedError
} from "../../../utils/errors";
import { logger } from "../../../utils/app-logger";
import { enqueueManualDashboardDemoParse } from "../../../services/manual-demo-parse.services";
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
    download_url: httpsUrlSchema,
    priority: z.number().int().min(1).max(10).optional().default(5),
    reparse: z.boolean().optional().default(false)
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

    const { match_game_id, download_url, priority } = parsed.data;
    const { match_id, map_order, external_match_room_id } = parsed.data;

    let matchGameId: number;
    const source = external_match_room_id ? "faceit" : "manual";
    if (match_game_id != null) {
      matchGameId = match_game_id;
    } else if (match_id != null) {
      matchGameId = await resolveOrCreateMatchGameIdForHubMatchDemo({
        matchId: match_id,
        demoUrl: download_url,
        mapOrder: map_order
      });
    } else {
      if (!external_match_room_id) {
        return next(new BadRequestError("Missing match identifier"));
      }

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
      reparse: parsed.data.reparse
    });

    res.status(200).json({
      status: "enqueued",
      match_game_id: result.match_game_id
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
