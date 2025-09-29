import { type Response, type NextFunction } from "express";
import {
  createStreamReservation,
  deleteStreamReservation,
  getStreamReservationsByMatch,
  updateStreamReservation
} from "../models/match-streams.models";
import type {
  RequestWithParams,
  RequestWithParamsAndBody,
  Reservation
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

export const updateStreamReservationController = async (
  req: RequestWithParamsAndBody<
    { match_id: string },
    { stream_url: string; reserve_both_games: boolean }
  >,
  res: Response,
  next: NextFunction
) => {
  const user = req.auth!; // Middleware ensures this is defined
  const matchId = +req.params.match_id;
  const is2xBO1 = await getMatchIs2xBO1(matchId);
  if (is2xBO1 && req.body.reserve_both_games) {
    const matches = await getMatchIdsWithSameExternalMatchRoomId(matchId);
    if (!matches) {
      return next(
        new NotFoundError("No matches found with same external match room id")
      );
    }
    const reservations = await Promise.allSettled(
      matches.map((match) =>
        updateStreamReservation(match.id, user.account_id, req.body.stream_url)
      )
    );
    res.status(200).json({
      message: "Stream reservation updated successfully",
      reservations: reservations
        .filter(
          (reservation): reservation is PromiseFulfilledResult<Reservation> =>
            reservation.status === "fulfilled"
        )
        .map((reservation) => reservation.value)
    });
  } else {
    const reservation = await updateStreamReservation(
      matchId,
      user.account_id,
      req.body.stream_url
    );
    res.status(200).json({
      message: "Stream reservation updated successfully",
      reservation: reservation
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

export const getMatchStreamReservationsController = async (
  req: RequestWithParams<{ match_id: string }>,
  res: Response
) => {
  // validateNumericParams middleware guarantees this is a valid number
  const matchId = +req.params.match_id;

  const reservations = await getStreamReservationsByMatch(matchId);

  // Extract just the stream URLs for the frontend
  const streamUrls = reservations.map((reservation) => reservation.stream_url);

  res.json({
    streamUrls
  });
};
