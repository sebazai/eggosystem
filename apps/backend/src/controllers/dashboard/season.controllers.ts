import {
  type RequestWithParams,
  type RequestWithBody
} from "@eggosystem/types";
import { type Response, type NextFunction } from "express";
import { getTeamsForSeason } from "../../models/team.models";
import { checkPlayerAdditionEligibility } from "../../models/dashboard/season.models";
import { createSeason } from "../../models/season.models";
import {
  seasonFormSchema,
  type SeasonFormRaw,
  type SeasonFormValues
} from "@eggosystem/types";
import { ZodError } from "zod";

// Helper function to convert local datetime to UTC MySQL format
const convertToUTC = (dateString: string, timezone?: string): string => {
  // Create date object from the input string
  const localDate = new Date(dateString);

  // If timezone is provided, we need to interpret the date in that timezone
  if (timezone) {
    // Convert to UTC by adjusting for timezone offset
    const utcDate = new Date(
      localDate.getTime() - localDate.getTimezoneOffset() * 60000
    );
    return utcDate.toISOString().replace("T", " ").replace("Z", "");
  }

  // Fallback: treat as UTC
  return localDate.toISOString().replace("T", " ").replace("Z", "");
};

/**
 * Controller to get all teams for a specific season
 * Returns teams with their league information
 */
export const getTeamsForSeasonController = async (
  req: RequestWithParams<{ season_id: string }>,
  res: Response
): Promise<void> => {
  const seasonId = Number(req.params.season_id);

  const teams = await getTeamsForSeason(seasonId);
  res.json(teams);
};

/**
 * Controller to check if a player can be added to a team
 * Returns analysis of the player's impact on team balance
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

  const eligibility = await checkPlayerAdditionEligibility(
    seasonId,
    teamId,
    steamId
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
      signup_start_date: validatedData.signup_start_date
        ? convertToUTC(validatedData.signup_start_date, validatedData.timezone)
        : null,
      signup_end_date: validatedData.signup_end_date
        ? convertToUTC(validatedData.signup_end_date, validatedData.timezone)
        : null,
      start_date: new Date(validatedData.start_date)
        .toISOString()
        .split("T")[0], // YYYY-MM-DD format
      end_date: validatedData.end_date
        ? new Date(validatedData.end_date).toISOString().split("T")[0]
        : null,
      platform: validatedData.platform,
      is_round_robin_bo2_as_2xbo1: validatedData.is_round_robin_bo2_as_2xbo1
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
