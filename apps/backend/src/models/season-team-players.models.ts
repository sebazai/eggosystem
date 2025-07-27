import type { PoolConnection } from "mysql2/promise";
import { runQuery } from "../db/mysqlRunQuery";
import type {
  FaceitMatchTeams,
  InsertSeasonTeamPlayer,
  SeasonPlayerApprovals,
  SeasonTeamPlayer
} from "@eggosystem/types";
import { buildInsertQueryParts } from "../db/utils";
import { getSeasonLeagueTeamByExternalId } from "./season-league-team.models";
import { redisClient } from "../utils/redisClient";

export const insertSeasonTeamPlayer = async (
  seasonId: number,
  teamId: number,
  data: InsertSeasonTeamPlayer,
  connection?: PoolConnection
) => {
  const { columns, placeholders, values } = buildInsertQueryParts(data);
  return runQuery<{ insertId: number }>(
    `INSERT INTO SeasonTeamPlayers (season_id, team_id, ${columns.join(", ")}) VALUES (?, ?, ${placeholders})`,
    [seasonId, teamId, ...values],
    connection
  );
};

export const isPlayerApprovedForSeasonManually = async (
  season_id: number,
  steam_id: string,
  team_id?: number,
  organization_id?: number
) => {
  if (!team_id && !organization_id) {
    throw new Error("Either team_id or organization_id must be provided");
  }
  const [result] = await runQuery<Array<SeasonPlayerApprovals>>(
    `SELECT spa.* 
     FROM SeasonPlayerApprovals spa 
      WHERE spa.season_id = ? AND spa.steam_id = ? AND (spa.team_id = ? OR spa.organization_id = ?)`,
    [season_id, steam_id, team_id ?? null, organization_id ?? null]
  );
  if (!result) {
    return { approved_by_organizer: false };
  }
  return {
    approved_by_organizer: !!result
  };
};

export const getSeasonTeamPlayersBySteamIds = async (steamIds: string[]) => {
  const result = await runQuery<Array<SeasonTeamPlayer>>(
    `SELECT * FROM SeasonTeamPlayers WHERE steam_id IN (?)`,
    [steamIds]
  );
  return result;
};

export const validatePlayersInTeams = async (
  teams: FaceitMatchTeams,
  externalMatchIds: string
) => {
  // get teams with external_team_id from SeasonLeagueTeams
  const teamsArray = [teams.faction1, teams.faction2];
  for (const team of teamsArray) {
    const teamFromDb = await getSeasonLeagueTeamByExternalId(team.faction_id);
    if (!teamFromDb) {
      throw new Error(
        `Team with external_team_id ${team.faction_id} not found`
      );
    }
    // get players from team.roster
    const playerSteamIds = team.roster.map((player) => player.game_player_id);
    // check if players are in SeasonTeamPlayers
    const playersInSeasonTeamPlayers =
      await getSeasonTeamPlayersBySteamIds(playerSteamIds);

    if (playersInSeasonTeamPlayers.length !== playerSteamIds.length) {
      // Add to redis as flag that players are not in SeasonTeamPlayers
      const key = `match:invalid_players:${externalMatchIds}`;
      const objectToSave = {
        external_match_id: externalMatchIds,
        steam_ids: playerSteamIds,
        team_id: teamFromDb.team_id
      };
      await redisClient.set(key, JSON.stringify(objectToSave));
    }
  }
};
