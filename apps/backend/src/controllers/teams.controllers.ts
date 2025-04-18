import { type Request, type Response } from "express";
import {
  getTeams,
  getTeamsByFilters,
  getTeamById,
  getTeamPlayers,
  getTeamMatches,
  getTeamMapStats
} from "../models/team.models";
import type { ParsedParams } from "@eggosystem/types";

export const getAllTeams = async (req: Request, res: Response) => {
  const allTeams = await getTeams();
  res.json(allTeams);
};

// Controller for getting teams with filter parameters
export const getTeamsByFiltersController = async (
  req: Request,
  res: Response
) => {
  try {
    const { season_ids, league_ids, team_ids } =
      req.parsedParams as ParsedParams;

    const teams = await getTeamsByFilters(season_ids, league_ids, team_ids);

    res.json(teams);
  } catch (error) {
    console.error("Error in getTeamsByFiltersController:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

// Controller for getting team details
export const getTeamDetailsController = async (req: Request, res: Response) => {
  try {
    const teamId = parseInt(req.params.teamId);
    const { season_ids, map_ids } = req.parsedParams as ParsedParams;

    if (isNaN(teamId)) {
      res.status(400).json({ error: "Invalid team ID" });
      return;
    }

    // Get team basic info
    const team = await getTeamById(teamId, season_ids);

    if (!team) {
      res.status(404).json({ error: "Team not found" });
      return;
    }

    // Get players stats for this team
    const players = await getTeamPlayers(teamId, season_ids, map_ids);

    // Get match history for this team
    const matches = await getTeamMatches(teamId, season_ids, map_ids);

    // Get map statistics for this team
    const map_stats = await getTeamMapStats(teamId, season_ids, map_ids);

    res.json({
      team,
      players,
      matches,
      map_stats
    });
  } catch (error) {
    console.error("Error in getTeamDetailsController:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
};
