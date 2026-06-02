import { type Response } from "express";
import { type RequestWithParams } from "@eggosystem/types";
import {
  getFlashLeaderboard,
  getRoundImpactLeaderboard,
  getUtilityDisciplineLeaderboard,
  type FlashLeaderboardSortBy,
  type UtilityDisciplineSortBy
} from "../models/leaderboard.models";

export const getFlashLeaderboardController = async (
  req: RequestWithParams<{ tournament_id: string }>,
  res: Response
) => {
  const tournament_id = parseInt(req.params.tournament_id, 10);
  const sortBy = (req.query.sortBy as FlashLeaderboardSortBy) || "blind_time";
  const minGames = req.query.minGames
    ? parseInt(req.query.minGames as string, 10)
    : 1;
  const data = await getFlashLeaderboard(tournament_id, { sortBy, minGames });
  res.json({ leaderboard: data });
};

export const getRoundImpactLeaderboardController = async (
  req: RequestWithParams<{ tournament_id: string }>,
  res: Response
) => {
  const tournament_id = parseInt(req.params.tournament_id, 10);
  const minGames = req.query.minGames
    ? parseInt(req.query.minGames as string, 10)
    : 1;
  const data = await getRoundImpactLeaderboard(tournament_id, { minGames });
  res.json({ leaderboard: data });
};

export const getUtilityDisciplineLeaderboardController = async (
  req: RequestWithParams<{ tournament_id: string }>,
  res: Response
) => {
  const tournament_id = parseInt(req.params.tournament_id, 10);
  const sortBy = (req.query.sortBy as UtilityDisciplineSortBy) || "wasted_asc";
  const minGames = req.query.minGames
    ? parseInt(req.query.minGames as string, 10)
    : 1;
  const data = await getUtilityDisciplineLeaderboard(tournament_id, {
    sortBy,
    minGames
  });
  res.json({ leaderboard: data });
};
