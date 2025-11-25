import { type Response, type NextFunction } from "express";
import { type RequestWithParams } from "@eggosystem/types";
import {
  getFantasyPlayersByLeague,
  createFantasyTeam,
  getFantasyTeamByUser,
  substitutePlayer,
  updatePlayerRoles,
  getFantasyLeaderboard,
  getFantasyOverallLeaderboard,
  getFantasyPriceHistory,
  getTopPerformingPlayers,
  getPlayerPointHistory,
  type CreateFantasyTeamData,
  type SubstitutionData,
  type PlayerRole
} from "../models/fantasy.models";
import { runQuery } from "../db/mysqlRunQuery";
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError
} from "../utils/errors";
import { calculateInitialPlayerValues } from "../services/fantasy-value.service";
import { getCurrentWeekNumberForSeason } from "../utils/week-calculation";

/**
 * Helper function to get Steam ID from authenticated user
 */
const getSteamIdFromAuth = async (accountId: number): Promise<string> => {
  const [linkedAccount] = await runQuery<Array<{ provider_id: string }>>(
    "SELECT provider_id FROM LinkedAccounts WHERE account_id = ? AND provider = 'steam'",
    [accountId]
  );

  if (!linkedAccount || !linkedAccount.provider_id) {
    throw new UnauthorizedError("User not linked to Steam");
  }

  return linkedAccount.provider_id;
};

export const getFantasyPlayersByLeagueController = async (
  req: RequestWithParams<{ season_id: string; league_id: string }>,
  res: Response
) => {
  const seasonId = Number(req.params.season_id);
  const leagueId = Number(req.params.league_id);

  const players = await getFantasyPlayersByLeague(seasonId, leagueId);

  res.json(players);
};

/**
 * Create a fantasy team
 */
export const createFantasyTeamController = async (
  req: RequestWithParams<{ season_id: string }>,
  res: Response,
  next: NextFunction
) => {
  if (!req.auth) {
    return next(new UnauthorizedError("Authentication required"));
  }

  const seasonId = Number(req.params.season_id);
  const { league_id, team_name, players } = req.body as {
    league_id: number;
    team_name?: string;
    players: Array<{
      steam_id?: string;
      player_id?: string; // Support both for backward compatibility
      role: PlayerRole | null;
      player_value: number;
    }>;
  };

  if (!league_id || !players || !Array.isArray(players)) {
    return next(new BadRequestError("Invalid request body"));
  }

  // Validate exactly 5 players
  if (players.length !== 5) {
    return next(
      new BadRequestError("Fantasy team must have exactly 5 players")
    );
  }

  // Validate team_name length (max 100 chars per DB schema)
  if (team_name && team_name.length > 100) {
    return next(
      new BadRequestError("Team name must be 100 characters or less")
    );
  }

  // Validate and map players (support both steam_id and player_id)
  const mappedPlayers = players.map((p) => {
    const steamId = p.steam_id || p.player_id;
    if (!steamId) {
      throw new BadRequestError("Each player must have steam_id or player_id");
    }
    return {
      steam_id: steamId,
      role: p.role,
      player_value: p.player_value
    };
  });

  const steamId = await getSteamIdFromAuth(req.auth.account_id);

  const teamData: CreateFantasyTeamData = {
    steam_id: steamId,
    season_id: seasonId,
    league_id,
    team_name,
    players: mappedPlayers
  };

  const teamId = await createFantasyTeam(teamData);

  res.status(201).json({
    success: true,
    team_id: teamId,
    message: "Fantasy team created successfully"
  });
};

/**
 * Get user's fantasy team
 */
export const getMyFantasyTeamController = async (
  req: RequestWithParams<{ season_id: string }>,
  res: Response,
  next: NextFunction
) => {
  if (!req.auth) {
    return next(new UnauthorizedError("Authentication required"));
  }

  const seasonId = Number(req.params.season_id);

  const steamId = await getSteamIdFromAuth(req.auth.account_id);
  const team = await getFantasyTeamByUser(steamId, seasonId);

  if (!team) {
    return next(new NotFoundError("Fantasy team not found"));
  }

  res.json(team);
};

/**
 * Get any user's fantasy team by steam_id (public)
 */
export const getFantasyTeamBySteamIdController = async (
  req: RequestWithParams<{ season_id: string; steam_id: string }>,
  res: Response,
  next: NextFunction
) => {
  const seasonId = Number(req.params.season_id);
  const steamId = req.params.steam_id;

  if (!steamId) {
    return next(new BadRequestError("steam_id parameter is required"));
  }

  const team = await getFantasyTeamByUser(steamId, seasonId);

  if (!team) {
    return next(new NotFoundError("Fantasy team not found"));
  }

  res.json(team);
};

/**
 * Substitute a player
 */
export const substitutePlayerController = async (
  req: RequestWithParams<{ season_id: string }>,
  res: Response,
  next: NextFunction
) => {
  if (!req.auth) {
    return next(new UnauthorizedError("Authentication required"));
  }

  const seasonId = Number(req.params.season_id);
  const body = req.body as {
    remove_steam_id?: string;
    remove_player_id?: string; // Support both for backward compatibility
    add_steam_id?: string;
    add_player_id?: string; // Support both for backward compatibility
    new_player_value: number;
    week_number: number;
    role?: PlayerRole | null;
  };

  const remove_steam_id = body.remove_steam_id || body.remove_player_id;
  const add_steam_id = body.add_steam_id || body.add_player_id;

  if (
    !remove_steam_id ||
    !add_steam_id ||
    !body.new_player_value ||
    body.week_number === undefined ||
    body.week_number === null
  ) {
    return next(new BadRequestError("Invalid request body"));
  }

  // Validate week_number is a positive integer
  if (!Number.isInteger(body.week_number) || body.week_number < 1) {
    return next(new BadRequestError("week_number must be a positive integer"));
  }

  const steamId = await getSteamIdFromAuth(req.auth.account_id);
  const team = await getFantasyTeamByUser(steamId, seasonId);

  if (!team) {
    return next(new NotFoundError("Fantasy team not found"));
  }

  const substitutionData: SubstitutionData = {
    remove_steam_id,
    add_steam_id,
    new_player_value: body.new_player_value,
    week_number: body.week_number,
    role: body.role
  };

  const result = await substitutePlayer(team.id, substitutionData);

  res.json({
    success: true,
    message: "Player substituted successfully",
    remaining_substitutions: result.remaining_substitutions
  });
};

/**
 * Update player roles
 */
export const updatePlayerRolesController = async (
  req: RequestWithParams<{ season_id: string }>,
  res: Response,
  next: NextFunction
) => {
  if (!req.auth) {
    return next(new UnauthorizedError("Authentication required"));
  }

  const seasonId = Number(req.params.season_id);
  const body = req.body as {
    role_updates: Array<{
      steam_id?: string;
      player_id?: string; // Support both for backward compatibility
      role: PlayerRole | null;
    }>;
    skip_swap_limit?: boolean;
  };

  if (!body.role_updates || !Array.isArray(body.role_updates)) {
    return next(new BadRequestError("Invalid request body"));
  }

  // Map role_updates to use steam_id
  const role_updates = body.role_updates.map((update) => {
    const steamId = update.steam_id || update.player_id;
    if (!steamId) {
      throw new BadRequestError(
        "Each role update must have steam_id or player_id"
      );
    }
    return {
      steam_id: steamId,
      role: update.role
    };
  });

  const steamId = await getSteamIdFromAuth(req.auth.account_id);
  const team = await getFantasyTeamByUser(steamId, seasonId);

  if (!team) {
    return next(new NotFoundError("Fantasy team not found"));
  }

  // Calculate current week number
  const weekNumber = await getCurrentWeekNumberForSeason(seasonId);

  const result = await updatePlayerRoles(
    team.id,
    role_updates,
    weekNumber,
    body.skip_swap_limit || false
  );

  res.json({
    success: true,
    message: "Player roles updated successfully",
    remaining_swaps: result.remaining_swaps
  });
};

/**
 * Get fantasy league leaderboard (division-specific)
 */
export const getFantasyLeaderboardController = async (
  req: RequestWithParams<{ season_id: string; league_id: string }>,
  res: Response
) => {
  const seasonId = Number(req.params.season_id);
  const leagueId = Number(req.params.league_id);

  // Get Steam ID from query param (supports both steam_id and team_id for backward compatibility)
  let steamId: string | undefined;

  // Prefer steam_id if provided
  if (req.query.steam_id) {
    steamId = String(req.query.steam_id);
  } else if (req.query.team_id) {
    // Fallback to team_id lookup
    const teamId = Number(req.query.team_id);
    const teamResult = await runQuery<Array<{ steam_id: string }>>(
      `SELECT steam_id FROM FantasyTeams WHERE id = ?`,
      [teamId]
    );
    if (teamResult && teamResult.length > 0) {
      steamId = teamResult[0].steam_id;
    }
  }

  const result = await getFantasyLeaderboard(seasonId, leagueId, steamId);

  res.json(result);
};

/**
 * Get overall fantasy leaderboard (cross-division)
 */
export const getFantasyOverallLeaderboardController = async (
  req: RequestWithParams<{ season_id: string }>,
  res: Response
) => {
  const seasonId = Number(req.params.season_id);

  // Get Steam ID if user is authenticated (optional)
  let steamId: string | undefined;
  if (req.auth) {
    try {
      steamId = await getSteamIdFromAuth(req.auth.account_id);
    } catch (_error) {
      // User not linked to Steam, continue without highlighting
      steamId = undefined;
    }
  }

  const result = await getFantasyOverallLeaderboard(seasonId, steamId);

  res.json(result);
};

/**
 * Get fantasy price history
 */
export const getFantasyPriceHistoryController = async (
  req: RequestWithParams<{ season_id: string; league_id: string }>,
  res: Response
) => {
  const seasonId = Number(req.params.season_id);
  const leagueId = Number(req.params.league_id);

  const priceHistory = await getFantasyPriceHistory(seasonId, leagueId);

  res.json(priceHistory);
};

/**
 * Seed initial player values for a league
 * This should be called before the fantasy season starts to set initial player values
 */
export const seedInitialPlayerValuesController = async (
  req: RequestWithParams<{ season_id: string; league_id: string }>,
  res: Response,
  next: NextFunction
) => {
  if (!req.auth) {
    return next(new UnauthorizedError("Authentication required"));
  }

  // Admin check - only admins can seed initial player values
  if (!req.auth.roles || !req.auth.roles.includes("admin")) {
    return next(new UnauthorizedError("Admin access required"));
  }

  const seasonId = Number(req.params.season_id);
  const leagueId = Number(req.params.league_id);

  // Calculate initial values for all players in the league
  const playerValues = await calculateInitialPlayerValues(seasonId, leagueId);

  if (!playerValues || playerValues.length === 0) {
    return next(new BadRequestError("No players found for this league"));
  }

  // Insert initial values into fantasy_player_values with week_number = 0
  const values = playerValues.map((pv) => [
    seasonId,
    leagueId,
    pv.steam_id,
    0, // week_number = 0 for initial values
    pv.value,
    pv.tier
  ]);

  const placeholders = values.map(() => "(?, ?, ?, ?, ?, ?)").join(", ");
  const flatValues = values.flat();

  await runQuery(
    `INSERT INTO FantasyPlayerValues 
     (season_id, league_id, steam_id, week_number, player_value, tier)
     VALUES ${placeholders}
     ON DUPLICATE KEY UPDATE 
       player_value = VALUES(player_value),
       tier = VALUES(tier)`,
    flatValues
  );

  res.json({
    message: "Initial player values seeded successfully",
    count: playerValues.length,
    values: playerValues
  });
};

/**
 * Get top performing players in a league
 */
export const getTopPerformingPlayersController = async (
  req: RequestWithParams<{ season_id: string; league_id: string }>,
  res: Response
) => {
  const seasonId = Number(req.params.season_id);
  const leagueId = Number(req.params.league_id);
  const limit = Number(req.query.limit) || 50;

  const players = await getTopPerformingPlayers(seasonId, leagueId, limit);

  res.json(players);
};

/**
 * Get point history for a player
 */
export const getPlayerPointHistoryController = async (
  req: RequestWithParams<{ season_id: string; player_id: string }>,
  res: Response,
  next: NextFunction
) => {
  if (!req.auth) {
    return next(new UnauthorizedError("Authentication required"));
  }

  const seasonId = Number(req.params.season_id);
  const playerSteamId = req.params.player_id; // This is actually steam_id

  // Verify the player belongs to the user's fantasy team
  const steamId = await getSteamIdFromAuth(req.auth.account_id);
  const team = await getFantasyTeamByUser(steamId, seasonId);

  if (!team) {
    return next(new NotFoundError("Fantasy team not found"));
  }

  const playerInTeam = team.players.find((p) => p.steam_id === playerSteamId);
  if (!playerInTeam) {
    return next(new BadRequestError("Player not in your fantasy team"));
  }

  const history = await getPlayerPointHistory(playerSteamId, seasonId);

  res.json(history);
};
