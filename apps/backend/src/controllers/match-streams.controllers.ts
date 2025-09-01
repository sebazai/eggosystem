import { type Response, type NextFunction } from "express";
import {
  createStreamReservation,
  deleteStreamReservation
} from "../models/match-streams.models";
import type {
  RequestWithParams,
  RequestWithParamsAndBody
} from "@eggosystem/types";
import { NotFoundError } from "../utils/errors";
import { z } from "zod";

const reserveStreamSchema = z.object({
  stream_url: z
    .string()
    .url("Invalid stream URL format")
    .min(1, "Stream URL is required")
});

export const reserveStreamController = async (
  req: RequestWithParamsAndBody<{ match_id: string }, { stream_url: string }>,
  res: Response,
  _next: NextFunction
) => {
  const user = req.auth!; // Middleware ensures this is defined

  // validateNumericParams middleware guarantees this is a valid number
  const matchId = +req.params.match_id;

  // Validate request body
  reserveStreamSchema.parse(req.body);

  const reservation = await createStreamReservation({
    match_id: matchId,
    account_id: user.account_id,
    stream_url: req.body.stream_url
  });

  res.status(201).json({
    message: "Stream reserved successfully",
    reservation
  });
};

export const unreserveStreamController = async (
  req: RequestWithParams<{ match_id: string }>,
  res: Response,
  next: NextFunction
) => {
  const user = req.auth!; // Middleware ensures this is defined

  // validateNumericParams middleware guarantees this is a valid number
  const matchId = +req.params.match_id;

  const deleted = await deleteStreamReservation(matchId, user.account_id);
  if (!deleted) {
    return next(
      new NotFoundError("No stream reservation found for this match")
    );
  }

  res.json({
    message: "Stream reservation removed successfully"
  });
};
