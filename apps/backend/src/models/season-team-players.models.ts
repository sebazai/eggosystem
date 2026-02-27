import type { PoolConnection } from "mysql2/promise";
import { runQuery } from "../db/mysqlRunQuery";
import type {
  FaceitMatchTeams,
  FlaggedMatches,
  InsertSeasonTeamPlayer,
  SeasonPlayerApprovals,
  SeasonTeamPlayer
} from "@eggosystem/types";
import { buildInsertQueryParts } from "../db/utils";
import { getSeasonLeagueTeamByExternalId } from "./season-league-team.models";
import { getOrganizerIdBySeasonId } from "./season.models";
import { redisClient } from "../utils/redisClient";
import { getHubMatchesByExternalMatchRoomId } from "./match.models";
import { BadRequestError } from "../utils/errors";
import { notifyFlaggedMatchInDiscord } from "../services/discord-organizer.services";
import { logger } from "../utils/app-logger";

/**
 * Check if player exists in SeasonTeamPlayers
 * Used for validating captain/co-captain assignments
 */
export const playerExistsInSeasonTeam = async (
  steamId: string,
  seasonId: number,
  teamId: number,
  connection?: PoolConnection
): Promise<boolean> => {
  const players = await runQuery<Array<{ steam_id: string }>>(
    `SELECT steam_id FROM SeasonTeamPlayers 
     WHERE season_id = ? AND team_id = ? AND steam_id = ? AND discarded_at IS NULL`,
    [seasonId, teamId, steamId],
    connection
  );

  return players && players.length > 0;
};

export const insertSeasonTeamPlayer = async (
  seasonId: number,
  teamId: number,
  data: InsertSeasonTeamPlayer,
  connection?: PoolConnection
) => {
  const { columns, placeholders, values } = buildInsertQueryParts(data);
  const query = `INSERT INTO SeasonTeamPlayers (season_id, team_id, ${columns.join(", ")}) VALUES (?, ?, ${placeholders})`;
  return runQuery<{ insertId: number }>(
    query,
    [seasonId, teamId, ...values],
    connection
  );
};

export const isPlayerApprovedForSeasonManually = async (
  season_id: number,
  steam_id: string,
  team_id?: number,
  organization_id?: number,
  connection?: PoolConnection
) => {
  if (!team_id && !organization_id) {
    throw new Error("Either team_id or organization_id must be provided");
  }

  const [result] = await runQuery<Array<SeasonPlayerApprovals>>(
    `SELECT spa.* 
     FROM SeasonPlayerApprovals spa 
      WHERE spa.season_id = ? AND spa.steam_id = ? AND (spa.team_id = ? OR spa.organization_id = ?)`,
    // Keep steam_id as string, if it is big int it might fail, e.g. 76561198159301980
    [season_id, String(steam_id), team_id ?? null, organization_id ?? null],
    connection
  );
  if (!result) {
    return { approved_by_organizer: false };
  }
  return {
    approved_by_organizer: !!result
  };
};

export const getSeasonTeamPlayersBySteamIds = async (
  seasonId: number,
  teamId: number,
  steamIds: string[]
) => {
  const questionMarks = steamIds.map(() => "?").join(",");
  const result = await runQuery<Array<SeasonTeamPlayer>>(
    `SELECT * FROM SeasonTeamPlayers WHERE season_id = ? AND team_id = ? AND steam_id IN (${questionMarks}) AND discarded_at IS NULL`,
    [seasonId, teamId, ...steamIds]
  );
  return result;
};

export const discardSeasonTeamPlayer = async (
  seasonId: number,
  teamId: number,
  steamId: string,
  discardedByAccountId: number,
  connection?: PoolConnection
) => {
  // First verify the player exists and is not already discarded
  const [existingPlayer] = await runQuery<Array<SeasonTeamPlayer>>(
    `SELECT * FROM SeasonTeamPlayers WHERE season_id = ? AND team_id = ? AND steam_id = ? AND discarded_at IS NULL`,
    [seasonId, teamId, steamId],
    connection
  );

  if (!existingPlayer) {
    throw new BadRequestError(
      `Player with steam_id ${steamId} not found in team ${teamId} for season ${seasonId}`
    );
  }

  if (existingPlayer.discarded_at !== null) {
    throw new BadRequestError(
      `Player with steam_id ${steamId} is already discarded from team ${teamId} for season ${seasonId}`
    );
  }

  // Check if player is a captain - cannot discard captain without assigning a new one first
  if (existingPlayer.is_captain) {
    throw new BadRequestError(
      "Please assign a new captain in role management for the team before removing the current captain"
    );
  }

  // Update the player to mark as discarded
  await runQuery(
    `UPDATE SeasonTeamPlayers SET discarded_at = NOW(), discarded_by = ? WHERE season_id = ? AND team_id = ? AND steam_id = ?`,
    [discardedByAccountId, seasonId, teamId, steamId],
    connection
  );
};

export const validatePlayersInTeams = async (
  seasonId: number,
  teams: FaceitMatchTeams,
  externalMatchId: string
) => {
  const matchIds = await getHubMatchesByExternalMatchRoomId(externalMatchId);

  if (!matchIds || matchIds.length === 0) {
    throw new Error(
      `Match with external_match_room_id ${externalMatchId} not found`
    );
  }

  const matchIdsArray = matchIds.map((match) => match.id);

  const teamsArray = [teams.faction1, teams.faction2];
  for (const team of teamsArray) {
    const teamFromDb = await getSeasonLeagueTeamByExternalId(
      team.faction_id,
      seasonId
    );
    if (!teamFromDb) {
      throw new Error(
        `Team with external_team_id ${team.faction_id} not found`
      );
    }
    // get players from team.roster
    const playerSteamIds = team.roster.map((player) => player.game_player_id);
    // check if players are in SeasonTeamPlayers
    const playersInSeasonTeamPlayers = await getSeasonTeamPlayersBySteamIds(
      teamFromDb.season_id,
      teamFromDb.team_id,
      playerSteamIds
    );

    // check if any player has match_id other then null, if it does, it should be in the matchIds array
    const playersWithMatchId = playersInSeasonTeamPlayers.filter(
      (player): player is SeasonTeamPlayer & { match_id: number } =>
        player.match_id !== null
    );

    const uniquePlayerSteamIds = [
      ...new Set(playersInSeasonTeamPlayers.map((player) => player.steam_id))
    ];

    if (
      uniquePlayerSteamIds.length !== playerSteamIds.length ||
      (playersWithMatchId.length > 0 &&
        !playersWithMatchId.some((stp) => matchIdsArray.includes(stp.match_id)))
    ) {
      // Add to redis as flag that players are not in SeasonTeamPlayers
      const key = `match:invalid_players:${externalMatchId}`;
      const alreadyFlaggedInRedis = (await redisClient.get(key)) !== null;

      const objectToSave = {
        external_match_id: externalMatchId,
        steam_ids: playerSteamIds,
        players_in_season_team_players: playersInSeasonTeamPlayers.map(
          (stp) => stp.steam_id
        ),
        team_id: teamFromDb.team_id,
        match_ids: matchIdsArray,
        players_added_for_this_match: playersWithMatchId.map(
          (stp) => stp.steam_id
        )
      } satisfies FlaggedMatches;
      await redisClient.set(key, JSON.stringify(objectToSave));

      const organizerId = await getOrganizerIdBySeasonId(seasonId);
      if (organizerId !== undefined && !alreadyFlaggedInRedis) {
        notifyFlaggedMatchInDiscord(organizerId, objectToSave).catch((err) => {
          logger.error(
            `Failed to notify Discord of flagged match ${externalMatchId}`,
            err
          );
        });
      }
    }
  }
};

export const getPrimaryPlayersForTeam = async (
  teamId: number,
  seasonId: number
) => {
  const query = `SELECT steam_id FROM SeasonTeamPlayers WHERE team_id = ? AND season_id = ? AND role = 'primary' AND discarded_at IS NULL`;
  const result = await runQuery<Array<{ steam_id: string }>>(query, [
    teamId,
    seasonId
  ]);
  return result.map((r) => r.steam_id);
};
