import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import {
  getFailedParseMessages,
  getFailedParseMessagesCount,
  getFailedParseMessageById,
  reparseFailedMessages,
  getFailedParseMessagesStats
} from "../../../models/failed-parse.models";
import type { ReparseRequest } from "@eggosystem/types";
import {
  NotFoundError,
  BadRequestError,
  UnauthorizedError
} from "../../../utils/errors";
import { logger } from "../../../utils/app-logger";
import { enqueueManualDashboardDemoParse } from "../../../services/manual-demo-parse.services";

const router = Router();

const manualParseQueueBodySchema = z.object({
  match_game_id: z.coerce.number().int().positive(),
  download_url: z
    .string()
    .min(1)
    .refine((val) => {
      try {
        return new URL(val).protocol === "https:";
      } catch {
        return false;
      }
    }, "Demo download URL must be a valid HTTPS URL"),
  priority: z.number().int().min(1).max(10).optional().default(5)
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
 * Staff-only: enqueue a manual HTTPS demo URL for a MatchGame on parse_queue (source dashboard-manual).
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

    logger.info("Manual parse-queue enqueue request", {
      actorAccountId,
      match_game_id
    });

    const result = await enqueueManualDashboardDemoParse({
      matchGameId: match_game_id,
      downloadUrl: download_url,
      priority,
      actorAccountId
    });

    res.status(200).json({
      status: "enqueued",
      match_game_id: result.match_game_id
    });
  }
);

/**
 * GET /v1/dashboard/demos/failed/parse
 * List failed parse messages with pagination and filtering
 */
router.get(
  "/failed/parse",
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
router.get(
  "/failed/parse/stats",
  async (req: Request, res: Response, _next: NextFunction) => {
    const stats = await getFailedParseMessagesStats();

    res.json({
      stats
    });
  }
);

/**
 * GET /v1/dashboard/demos/failed/parse/:id
 * Get a specific failed parse message by ID
 */
router.get(
  "/failed/parse/:id",
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
router.post(
  "/failed/parse/reparse",
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

    // Execute reparse
    const result = await reparseFailedMessages(reparseRequest);

    // Return appropriate status code based on result
    const statusCode = result.success ? 200 : 400;

    res.status(statusCode).json(result);
  }
);

export default router;
