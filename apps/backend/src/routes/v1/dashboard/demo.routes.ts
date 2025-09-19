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
import { NotFoundError, BadRequestError } from "../../../utils/errors";
import { logger } from "../../../utils/app-logger";

const router = Router();

// Query parameter schema for listing failed messages
const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  queue_name: z.string().optional(),
  status: z.string().optional()
});

// Schema for reparse request
const reparseRequestSchema = z.object({
  message_ids: z.array(z.number().int().positive()).min(1).max(50),
  priority: z.number().int().min(1).max(10).optional().default(5)
});

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
