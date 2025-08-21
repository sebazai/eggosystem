import { runQuery } from "../db/mysqlRunQuery";
import { getActiveSignupOrActiveSeasonForAppId } from "./season.models";
import type { TeamCaptain } from "@eggosystem/types";

/**
 * Get team captains for a specific season
 */
export const getTeamCaptainsBySeasonId = async (
  seasonId: number
): Promise<TeamCaptain[]> => {
  const results = await runQuery<TeamCaptain[]>(
    `SELECT 
      t.id AS team_id,
      t.name AS team_name,
      captain_account.discord AS captain_discord,
      co_captain_account.discord AS co_captain_discord
    FROM Teams t
    JOIN SeasonTeamRegistrations str ON t.id = str.team_id
    JOIN SeasonTeamRegistrationPlayers strp_captain ON 
      strp_captain.season_id = str.season_id AND 
      strp_captain.team_id = str.team_id AND 
      strp_captain.is_captain = 1
    JOIN SteamPlayers sp_captain ON strp_captain.steam_id = sp_captain.steam_id
    JOIN Accounts captain_account ON sp_captain.account_id = captain_account.id
    LEFT JOIN SeasonTeamRegistrationPlayers strp_co_captain ON 
      strp_co_captain.season_id = str.season_id AND 
      strp_co_captain.team_id = str.team_id AND 
      strp_co_captain.is_co_captain = 1
    LEFT JOIN SteamPlayers sp_co_captain ON strp_co_captain.steam_id = sp_co_captain.steam_id
    LEFT JOIN Accounts co_captain_account ON sp_co_captain.account_id = co_captain_account.id
    WHERE str.season_id = ?
    ORDER BY t.name`,
    [seasonId]
  );

  return results;
};

/**
 * Get team captains for all teams across all seasons
 */
export const getAllTeamCaptains = async (): Promise<TeamCaptain[]> => {
  // Get the most recent captain/co-captain for each team
  const results = await runQuery<TeamCaptain[]>(
    `SELECT 
      t.id AS team_id,
      t.name AS team_name,
      captain_account.discord AS captain_discord,
      co_captain_account.discord AS co_captain_discord
    FROM Teams t
    JOIN (
      SELECT team_id, MAX(season_id) as latest_season_id
      FROM SeasonTeamRegistrations
      GROUP BY team_id
    ) latest_reg ON t.id = latest_reg.team_id
    JOIN SeasonTeamRegistrations str ON 
      t.id = str.team_id AND 
      str.season_id = latest_reg.latest_season_id
    JOIN SeasonTeamRegistrationPlayers strp_captain ON 
      strp_captain.season_id = str.season_id AND 
      strp_captain.team_id = str.team_id AND 
      strp_captain.is_captain = 1
    JOIN SteamPlayers sp_captain ON strp_captain.steam_id = sp_captain.steam_id
    JOIN Accounts captain_account ON sp_captain.account_id = captain_account.id
    LEFT JOIN SeasonTeamRegistrationPlayers strp_co_captain ON 
      strp_co_captain.season_id = str.season_id AND 
      strp_co_captain.team_id = str.team_id AND 
      strp_co_captain.is_co_captain = 1
    LEFT JOIN SteamPlayers sp_co_captain ON strp_co_captain.steam_id = sp_co_captain.steam_id
    LEFT JOIN Accounts co_captain_account ON sp_co_captain.account_id = co_captain_account.id
    ORDER BY t.name`
  );

  return results;
};

/**
 * Get active season or signup season for app ID
 */
export const getTeamCaptainsForActiveSeasonByAppId = async (
  appId: number = 730,
  organizerId: number = 1
): Promise<TeamCaptain[]> => {
  const activeSeason = await getActiveSignupOrActiveSeasonForAppId(
    organizerId,
    appId
  );

  if (!activeSeason) {
    return [];
  }

  return getTeamCaptainsBySeasonId(activeSeason.season_id);
};
