import type { Request, Response, NextFunction } from "express";
import { runQuery } from "../db/mysqlRunQuery";
import { logger } from "../utils/app-logger";

interface AuditConfig {
  getEntityInfo?: (
    req: Request,
    res: Response
  ) => {
    entityType: string;
    entityId: number | null;
  };
  actionType?: string;
}

export function auditAfterResponse(config: AuditConfig) {
  return function (req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    let responseBody: unknown;

    const originalJson = res.json.bind(res);
    res.json = function (body: unknown) {
      responseBody = body;
      return originalJson(body);
    };

    res.on("finish", async () => {
      const duration = Date.now() - startTime;
      const userId = req.auth?.account_id ?? null;

      const { entityType, entityId } = config.getEntityInfo?.(req, res) ?? {
        entityType: "Unknown",
        entityId: null
      };

      try {
        if (res.statusCode !== 304 && res.statusCode <= 399) {
          await runQuery(
            `
            INSERT INTO AuditLog (
              action_type,
              entity_type,
              entity_id,
              user_id,
              request_data,
              response_data,
              response_status,
              response_message,
              user_agent,
              metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
            [
              config.actionType ?? `${req.method} ${req.originalUrl}`,
              entityType,
              entityId,
              userId,
              req.body ? JSON.stringify(req.body) : null,
              responseBody ? JSON.stringify(responseBody) : null,
              res.statusCode,
              res.statusMessage,
              req.headers["user-agent"] || "",
              JSON.stringify({ durationMs: duration })
            ]
          );
        }
      } catch (err) {
        logger.error("Failed to save audit log", err);
      }
    });

    next();
  };
}

export const auditReadEntity = (entity: string, idFromParams = "id") =>
  auditAfterResponse({
    actionType: `Read ${entity}`,
    getEntityInfo: (req) => ({
      entityType: entity,
      entityId: req.params[idFromParams]
        ? Number(req.params[idFromParams])
        : (req.auth?.account_id ?? null)
    })
  });

export const auditUpdateEntity = (entity: string, idFromParams = "id") =>
  auditAfterResponse({
    actionType: `Update ${entity}`,
    getEntityInfo: (req) => ({
      entityType: entity,
      entityId: req.params[idFromParams]
        ? Number(req.params[idFromParams])
        : (req.auth?.account_id ?? null)
    })
  });

export const auditDeleteEntity = (entity: string, idFromParams = "id") =>
  auditAfterResponse({
    actionType: `Delete ${entity}`,
    getEntityInfo: (req) => ({
      entityType: entity,
      entityId: req.params[idFromParams]
        ? Number(req.params[idFromParams])
        : (req.auth?.account_id ?? null)
    })
  });
