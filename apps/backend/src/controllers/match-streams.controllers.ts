import { type Response, type NextFunction } from "express";
import {
  createStreamReservation,
  deleteStreamReservation
} from "../models/match-streams.models";
import type { RequestWithParams, RequestWithBody } from "@eggosystem/types";
import {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError
} from "../utils/errors";
import { getRolesForAccountId } from "../services/auth.services";
import { z } from "zod";

const reserveStreamSchema = z.object({
  stream_url: z
    .string()
    .url("Invalid stream URL format")
    .min(1, "Stream URL is required")
});

export const reserveStreamController = async (
  req: RequestWithBody<{ stream_url: string }>,
  res: Response,
  next: NextFunction
) => {
  const user = req.auth;
  if (!user) {
    return next(new UnauthorizedError("Authentication required"));
  }

  const matchId = parseInt(
    (req as RequestWithParams<{ match_id: string }>).params.match_id
  );
  if (isNaN(matchId)) {
    return next(new BadRequestError("Invalid match ID"));
  }

  // Check if user has caster role
  const userRoles = await getRolesForAccountId(user.account_id);
  if (!userRoles.includes("caster")) {
    return next(new ForbiddenError("Caster role required"));
  }

  // Validate request body
  try {
    reserveStreamSchema.parse(req.body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new BadRequestError("Invalid request data"));
    }
    throw error;
  }

  try {
    const reservation = await createStreamReservation({
      match_id: matchId,
      account_id: user.account_id,
      stream_url: req.body.stream_url
    });

    res.status(201).json({
      message: "Stream reserved successfully",
      reservation
    });
  } catch (error) {
    return next(error);
  }
};

export const unreserveStreamController = async (
  req: RequestWithParams<{ match_id: string }>,
  res: Response,
  next: NextFunction
) => {
  const user = req.auth;
  if (!user) {
    return next(new UnauthorizedError("Authentication required"));
  }

  const matchId = parseInt(req.params.match_id);
  if (isNaN(matchId)) {
    return next(new BadRequestError("Invalid match ID"));
  }

  // Check if user has caster role
  const userRoles = await getRolesForAccountId(user.account_id);
  if (!userRoles.includes("caster")) {
    return next(new ForbiddenError("Caster role required"));
  }

  try {
    const deleted = await deleteStreamReservation(matchId, user.account_id);
    if (!deleted) {
      return next(
        new NotFoundError("No stream reservation found for this match")
      );
    }

    res.json({
      message: "Stream reservation removed successfully"
    });
  } catch (error) {
    return next(error);
  }
};
