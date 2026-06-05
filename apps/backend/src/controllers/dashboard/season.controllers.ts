import {
  type RequestWithParams,
  type RequestWithBody
} from "@eggosystem/types";
import { type Response, type NextFunction, type Request } from "express";
import { getTeamsForSeason } from "../../models/team.models";
import { checkPlayerAdditionEligibility } from "../../models/dashboard/season.models";
import {
  createSeason,
  updateSeason,
  getSeasonById,
  getSeasons
} from "../../models/season.models";
import {
  seasonFormSchema,
  type SeasonFormRaw,
  type SeasonFormValues
} from "@eggosystem/types";
import { ZodError } from "zod";

/**
 * Controller to get all seasons
 * Returns all seasons sorted by most recent first
 */
export const getAllSeasonsController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const seasons = await getSeasons();

  // Sort by id descending (most recent first)
  const sortedSeasons = seasons.sort((a, b) => b.id - a.id);

  res.json(sortedSeasons);
};

/**
 * Controller to get a single season by ID
 * Returns the season data for editing
 */
export const getSeasonByIdController = async (
  req: RequestWithParams<{ id: string }>,
  res: Response
): Promise<void> => {
  const seasonId = Number(req.params.id);
  const season = await getSeasonById(seasonId);

  if (!season) {
    res.status(404).json({ message: "Season not found" });
    return;
  }

  res.json(season);
};

/**
 * Controller to get all teams for a specific season
 * Returns teams with their league information
 * Supports query parameter ?context=registration to fetch teams from SeasonTeamRegistrationPlayers
 */
export const getTeamsForSeasonController = async (
  req: RequestWithParams<{ season_id: string }>,
  res: Response
): Promise<void> => {
  const seasonId = Number(req.params.season_id);
  const context =
    (req.query.context as string) === "registration"
      ? "registration"
      : "finalized";

  const teams = await getTeamsForSeason(seasonId, context);
  res.json(teams);
};

/**
 * Controller to check if a player can be added to a team
 * Returns analysis of the player's impact on team balance
 *
 * Query Parameters:
 * - excludeSteamId (optional): Steam ID of player to exclude from calculations (for substitution scenarios)
 */
export const checkPlayerAdditionEligibilityController = async (
  req: RequestWithParams<{
    season_id: string;
    team_id: string;
    steam_id: string;
  }>,
  res: Response
): Promise<void> => {
  const seasonId = Number(req.params.season_id);
  const teamId = Number(req.params.team_id);
  const steamId = req.params.steam_id;
  const excludeSteamId = req.query.excludeSteamId as string | undefined;

  const eligibility = await checkPlayerAdditionEligibility(
    seasonId,
    teamId,
    steamId,
    { excludeSteamId }
  );
  res.json(eligibility);
};

/**
 * Controller to create a new season
 * Validates the request body with Zod schema and creates the season
 */
export const createSeasonController = async (
  req: RequestWithBody<SeasonFormValues>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Validate the request body with Zod schema
    const validatedData = seasonFormSchema.parse(req.body);

    // Convert form data to raw format for database insertion
    const seasonData: SeasonFormRaw = {
      game_id: validatedData.game_id,
      game_type_id: validatedData.game_type_id,
      organizer_id: validatedData.organizer_id,
      name: validatedData.name,
      full_name: validatedData.full_name,
      signup_start_date: validatedData.signup_start_date ?? null,
      signup_end_date: validatedData.signup_end_date ?? null,
      start_date: new Date(validatedData.start_date)
        .toISOString()
        .split("T")[0], // YYYY-MM-DD format
      end_date: validatedData.end_date
        ? new Date(validatedData.end_date).toISOString().split("T")[0]
        : null,
      platform: validatedData.platform,
      is_round_robin_bo2_as_2xbo1: validatedData.is_round_robin_bo2_as_2xbo1,
      grand_final_round_one_only: validatedData.grand_final_round_one_only,
      payment_link: validatedData.payment_link || null,
      registration_price: validatedData.registration_price ?? null,
      has_vat: validatedData.has_vat,
      early_bird_price_discount:
        validatedData.early_bird_price_discount ?? null,
      early_bird_price_discount_end_date:
        validatedData.early_bird_price_discount_end_date ?? null,
      active_map_pool: validatedData.active_map_pool,
      rulebook_url: validatedData.rulebook_url || null,
      discord_link: validatedData.discord_link || null,
      faceit_rank_required: validatedData.faceit_rank_required ?? false,
      premier_rank_required: validatedData.premier_rank_required ?? false,
      hours_played_required: validatedData.hours_played_required ?? false,
      min_players: validatedData.min_players,
      max_players: validatedData.max_players
    };

    // Create the season in the database
    const result = await createSeason(seasonData);

    res.status(201).json({
      message: "Season created successfully",
      seasonId: result.insertId
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return next(error);
    }
    next(error);
  }
};

/**
 * Controller to update an existing season
 * Validates the request body with Zod schema and updates the season
 */
export const updateSeasonController = async (
  req: RequestWithParams<{ id: string }> & RequestWithBody<SeasonFormValues>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const seasonId = Number(req.params.id);

    // Check if season exists
    const existingSeason = await getSeasonById(seasonId);
    if (!existingSeason) {
      res.status(404).json({ message: "Season not found" });
      return;
    }

    // Validate the request body with Zod schema
    const validatedData = seasonFormSchema.parse(req.body);

    // Convert form data to raw format for database update
    const seasonData: SeasonFormRaw = {
      game_id: validatedData.game_id,
      game_type_id: validatedData.game_type_id,
      organizer_id: validatedData.organizer_id,
      name: validatedData.name,
      full_name: validatedData.full_name,
      signup_start_date: validatedData.signup_start_date ?? null,
      signup_end_date: validatedData.signup_end_date ?? null,
      start_date: new Date(validatedData.start_date)
        .toISOString()
        .split("T")[0], // YYYY-MM-DD format
      end_date: validatedData.end_date
        ? new Date(validatedData.end_date).toISOString().split("T")[0]
        : null,
      platform: validatedData.platform,
      is_round_robin_bo2_as_2xbo1: validatedData.is_round_robin_bo2_as_2xbo1,
      grand_final_round_one_only: validatedData.grand_final_round_one_only,
      payment_link: validatedData.payment_link || null,
      registration_price: validatedData.registration_price ?? null,
      has_vat: validatedData.has_vat,
      early_bird_price_discount:
        validatedData.early_bird_price_discount ?? null,
      early_bird_price_discount_end_date:
        validatedData.early_bird_price_discount_end_date ?? null,
      active_map_pool: validatedData.active_map_pool,
      rulebook_url: validatedData.rulebook_url || null,
      discord_link: validatedData.discord_link || null,
      faceit_rank_required: validatedData.faceit_rank_required ?? false,
      premier_rank_required: validatedData.premier_rank_required ?? false,
      hours_played_required: validatedData.hours_played_required ?? false,
      min_players: validatedData.min_players,
      max_players: validatedData.max_players
    };

    // Update the season in the database
    await updateSeason(seasonId, seasonData);

    res.json({
      message: "Season updated successfully",
      seasonId
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return next(error);
    }
    next(error);
  }
};
