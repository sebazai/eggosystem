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
import { redisClient } from "../utils/redisClient";
import { getHubMatchesByExternalMatchRoomId } from "./match.models";

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

export const getSeasonTeamPlayersBySteamIds = async (
  seasonId: number,
  steamIds: string[]
) => {
  const questionMarks = steamIds.map(() => "?").join(",");
  const result = await runQuery<Array<SeasonTeamPlayer>>(
    `SELECT * FROM SeasonTeamPlayers WHERE season_id = ? AND steam_id IN (${questionMarks})`,
    [seasonId, ...steamIds]
  );
  return result;
};

export const validatePlayersInTeams = async (
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
    const teamFromDb = await getSeasonLeagueTeamByExternalId(team.faction_id);
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
      playerSteamIds
    );

    // check if any player has match_id other then null, if it does, it should be in the matchIds array
    const playersWithMatchId = playersInSeasonTeamPlayers.filter(
      (player): player is SeasonTeamPlayer & { match_id: number } =>
        player.match_id !== null
    );

    if (
      playersInSeasonTeamPlayers.length !== playerSteamIds.length ||
      playersWithMatchId.some((stp) => !matchIdsArray.includes(stp.match_id))
    ) {
      // Add to redis as flag that players are not in SeasonTeamPlayers
      const key = `match:invalid_players:${externalMatchId}`;
      const objectToSave = {
        external_match_id: externalMatchId,
        steam_ids: playerSteamIds,
        team_id: teamFromDb.team_id,
        match_ids: matchIdsArray,
        players_added_for_this_match: playersWithMatchId.map(
          (stp) => stp.steam_id
        )
      } satisfies FlaggedMatches;
      await redisClient.set(key, JSON.stringify(objectToSave));
    }
  }
};
