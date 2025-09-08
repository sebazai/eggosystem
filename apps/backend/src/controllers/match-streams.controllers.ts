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
import {
  getMatchIdsWithSameExternalMatchRoomId,
  getMatchIs2xBO1
} from "../models/match.models";

const reserveStreamSchema = z.object({
  stream_url: z
    .string()
    .url("Invalid stream URL format")
    .min(1, "Stream URL is required")
});

export const reserveStreamController = async (
  req: RequestWithParamsAndBody<
    { match_id: string },
    { stream_url: string; reserve_both_games: boolean }
  >,
  res: Response,
  next: NextFunction
) => {
  const user = req.auth!; // Middleware ensures this is defined

  const matchId = +req.params.match_id;

  reserveStreamSchema.parse(req.body);

  const is2xBO1 = await getMatchIs2xBO1(matchId);

  if (req.body.reserve_both_games && is2xBO1) {
    const matches = await getMatchIdsWithSameExternalMatchRoomId(matchId);
    if (!matches) {
      return next(
        new NotFoundError("No matches found with same external match room id")
      );
    }
    const reservations = await Promise.all(
      matches.map((match) =>
        createStreamReservation({
          match_id: match.id,
          account_id: user.account_id,
          stream_url: req.body.stream_url
        })
      )
    );
    res.status(201).json({
      message: "Streams reserved successfully",
      reservations: reservations
    });
  } else {
    const reservation = await createStreamReservation({
      match_id: matchId,
      account_id: user.account_id,
      stream_url: req.body.stream_url
    });
    res.status(201).json({
      message: "Stream reserved successfully",
      reservations: [reservation]
    });
  }
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
