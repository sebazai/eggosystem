import { type Response, type NextFunction } from "express";
import {
  type RequestWithParams,
  type RequestWithBody,
  type RequestWithParamsAndBody
} from "@eggosystem/types";
import { NotFoundError, BadRequestError } from "../../utils/errors";
import { getSeasonLeaguesWithMappingsBySeasonId } from "../../models/season-league.models";
import {
  getSeasonLeagueExternalIdById,
  insertSeasonLeagueExternalId,
  updateSeasonLeagueExternalId,
  deleteSeasonLeagueExternalId
} from "../../models/season-league-external-id.models";
import { updateLeagueName, getLeagueById } from "../../models/league.models";
import type {
  CreateSeasonLeagueExternalIdRequest,
  UpdateSeasonLeagueExternalIdRequest,
  UpdateLeagueNameRequest,
  SeasonLeagueWithMappings
} from "@eggosystem/types";
import JSONBig from "json-bigint";

/**
 * Get all SeasonLeagues with their mappings for a given season
 */
export const getSeasonLeaguesWithMappingsController = async (
  req: RequestWithParams<{ season_id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const seasonId = Number(req.params.season_id);

  if (isNaN(seasonId)) {
    return next(new BadRequestError("Invalid season_id parameter"));
  }

  const rawResults = await getSeasonLeaguesWithMappingsBySeasonId(seasonId);

  // Parse JSON mappings with JSONBig to preserve large integers
  const results: SeasonLeagueWithMappings[] = rawResults.map((row) => ({
    season_id: row.season_id,
    league_id: row.league_id,
    tier: row.tier,
    league_name: row.league_name,
    mappings_count: row.mappings_count,
    mappings: row.mappings
      ? JSONBig({ storeAsString: true }).parse(row.mappings).filter(Boolean)
      : null
  }));

  res.json(results);
};

/**
 * Get a single mapping by ID
 */
export const getSeasonLeagueExternalIdController = async (
  req: RequestWithParams<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return next(new BadRequestError("Invalid id parameter"));
  }

  const result = await getSeasonLeagueExternalIdById(id);

  if (!result) {
    return next(new NotFoundError("Mapping not found"));
  }

  res.json(result);
};

/**
 * Create a new mapping
 */
export const createSeasonLeagueExternalIdController = async (
  req: RequestWithBody<CreateSeasonLeagueExternalIdRequest>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const {
    season_id,
    league_id,
    external_id,
    external_league_name,
    stage_id,
    type: game_mode,
    manual_group
  } = req.body;

  // Validation
  if (
    !season_id ||
    !league_id ||
    !external_id ||
    !external_league_name ||
    !stage_id ||
    !game_mode
  ) {
    return next(
      new BadRequestError(
        "Missing required fields: season_id, league_id, external_id, external_league_name, stage_id, type"
      )
    );
  }

  if (
    !["roundRobin", "doubleElimination", "singleElimination"].includes(
      game_mode
    )
  ) {
    return next(
      new BadRequestError(
        "Invalid type. Must be one of: roundRobin, doubleElimination, singleElimination"
      )
    );
  }

  if (![1, 2].includes(stage_id)) {
    return next(
      new BadRequestError(
        "Invalid stage_id. Must be 1 (Regular) or 2 (Playoff)"
      )
    );
  }

  if (external_league_name.length > 255) {
    return next(
      new BadRequestError("external_league_name must be 255 characters or less")
    );
  }

  if (external_id.length > 255) {
    return next(
      new BadRequestError("external_id must be 255 characters or less")
    );
  }

  const result = await insertSeasonLeagueExternalId(
    external_id,
    external_league_name,
    season_id,
    league_id,
    stage_id,
    game_mode,
    manual_group
  );

  res.status(201).json({ id: result.insertId });
};

/**
 * Update an existing mapping
 */
export const updateSeasonLeagueExternalIdController = async (
  req: RequestWithParamsAndBody<
    { id: string },
    UpdateSeasonLeagueExternalIdRequest
  >,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return next(new BadRequestError("Invalid id parameter"));
  }

  const {
    external_id,
    external_league_name,
    stage_id,
    type: game_mode,
    manual_group
  } = req.body;

  // Validation
  if (!external_id || !external_league_name || !stage_id || !game_mode) {
    return next(
      new BadRequestError(
        "Missing required fields: external_id, external_league_name, stage_id, type"
      )
    );
  }

  if (
    !["roundRobin", "doubleElimination", "singleElimination"].includes(
      game_mode
    )
  ) {
    return next(
      new BadRequestError(
        "Invalid type. Must be one of: roundRobin, doubleElimination, singleElimination"
      )
    );
  }

  if (![1, 2].includes(stage_id)) {
    return next(
      new BadRequestError(
        "Invalid stage_id. Must be 1 (Regular) or 2 (Playoff)"
      )
    );
  }

  if (external_league_name.length > 255) {
    return next(
      new BadRequestError("external_league_name must be 255 characters or less")
    );
  }

  if (external_id.length > 255) {
    return next(
      new BadRequestError("external_id must be 255 characters or less")
    );
  }

  // Check if mapping exists
  const existingMapping = await getSeasonLeagueExternalIdById(id);
  if (!existingMapping) {
    return next(new NotFoundError("Mapping not found"));
  }

  await updateSeasonLeagueExternalId(id, {
    external_id,
    external_league_name,
    stage_id,
    type: game_mode,
    manual_group
  });

  res.json({ message: "Mapping updated successfully" });
};

/**
 * Delete a mapping
 */
export const deleteSeasonLeagueExternalIdController = async (
  req: RequestWithParams<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return next(new BadRequestError("Invalid id parameter"));
  }

  // Check if mapping exists
  const existingMapping = await getSeasonLeagueExternalIdById(id);
  if (!existingMapping) {
    return next(new NotFoundError("Mapping not found"));
  }

  await deleteSeasonLeagueExternalId(id);

  res.json({ message: "Mapping deleted successfully" });
};

/**
 * Update a league name
 */
export const updateLeagueNameController = async (
  req: RequestWithParamsAndBody<{ league_id: string }, UpdateLeagueNameRequest>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const leagueId = Number(req.params.league_id);

  if (isNaN(leagueId)) {
    return next(new BadRequestError("Invalid league_id parameter"));
  }

  const { name } = req.body;

  // Validation
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return next(new BadRequestError("League name must be a non-empty string"));
  }

  if (name.length > 255) {
    return next(
      new BadRequestError("League name must be 255 characters or less")
    );
  }

  // Check if league exists
  const existingLeague = await getLeagueById(leagueId);
  if (!existingLeague) {
    return next(new NotFoundError("League not found"));
  }

  await updateLeagueName(leagueId, name.trim());

  res.json({ message: "League name updated successfully" });
};
