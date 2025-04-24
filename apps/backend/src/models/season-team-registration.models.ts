import type { PoolConnection } from "mysql2/promise";
import { runQuery } from "../db/mysqlRunQuery";
import { buildInsertQueryParts } from "../db/utils";
import type {
  InsertSeasonTeamRegistration,
  Organizations,
  PlayerSchemaType,
  SeasonTeamPlayer,
  SeasonTeamRegistration,
  SignupFormValues,
  SteamPlayer,
  Team,
  UpdateSeasonTeamRegistration
} from "@eggosystem/types";
import _ from "lodash";
import { insertSeasonTeamPlayer } from "./season-team-players.models";

export const getSeasonTeamRegistrationBySeasonAndTeamId = async (
  seasonId: number,
  teamId: number,
  connection?: PoolConnection
) => {
  const result = await runQuery<SeasonTeamRegistration[]>(
    `SELECT * FROM SeasonTeamRegistrations WHERE season_id = ? AND team_id = ? LIMIT 1`,
    [seasonId, teamId],
    connection
  );
  if (result.length === 0) {
    throw new Error(
      `Could not find registration with season ${seasonId} and team ${teamId}`
    );
  }
  return result[0];
};

export const insertSeasonTeamRegistration = async (
  seasonId: number,
  teamId: number,
  data: InsertSeasonTeamRegistration,
  connection?: PoolConnection
) => {
  const { columns, placeholders, values } = buildInsertQueryParts(data);
  return runQuery<{ insertId: number }>(
    `INSERT INTO SeasonTeamRegistrations (season_id, team_id, ${columns.join(", ")}) VALUES (?, ?, ${placeholders})`,
    [seasonId, teamId, ...values],
    connection
  );
};

export const updateSeasonTeamRegistration = async (
  seasonId: number,
  teamId: number,
  data: UpdateSeasonTeamRegistration,
  connection?: PoolConnection
) => {
  const query = `UPDATE SeasonTeamRegistrations SET captain_steam_id = ?, co_captain_steam_id = ?, external_platform_id = ? WHERE season_id = ? AND team_id = ?;`;
  return runQuery(
    query,
    [
      data.captain_steam_id,
      data.co_captain_steam_id,
      data.external_platform_id,
      seasonId,
      teamId
    ],
    connection
  );
};

export const updatePlayersForSeasonTeamRegistration = async (
  seasonId: number,
  teamId: number,
  players: PlayerSchemaType[],
  connection: PoolConnection
) => {
  const existingPlayers = await runQuery<SeasonTeamPlayer[]>(
    `SELECT * FROM SeasonTeamPlayers WHERE season_id = ? AND team_id = ?`,
    [seasonId, teamId]
  );

  if (existingPlayers.length === 0) {
    throw new Error(
      `No existing registerd players for team ID ${teamId} in season ${seasonId}`
    );
  }

  const submittedById = _.keyBy(players, "steamId");
  const existingById = _.keyBy(existingPlayers, "steam_id");

  const submittedSteamIds = Object.keys(submittedById);
  const existingSteamIds = Object.keys(existingById);

  const steamIdsToDelete = _.difference(existingSteamIds, submittedSteamIds);
  const steamIdsToAdd = _.difference(submittedSteamIds, existingSteamIds);

  if (steamIdsToDelete.length > 0) {
    const placeholders = steamIdsToDelete.map(() => "?").join(", ");
    await runQuery(
      `DELETE FROM SeasonTeamPlayers WHERE season_id = ? AND team_id = ? AND steam_id IN (${placeholders})`,
      [seasonId, teamId, ...steamIdsToDelete],
      connection
    );
  }

  if (steamIdsToAdd.length > 0) {
    const playersToAdd = steamIdsToAdd.map((id) => submittedById[id]);
    await Promise.all(
      playersToAdd.map((player) =>
        insertSeasonTeamPlayer(
          seasonId,
          teamId,
          { steam_id: player.steamId },
          connection
        )
      )
    );
  }
  return { removed: steamIdsToDelete, added: steamIdsToAdd };
};

interface TeamSignupQueryData extends SeasonTeamRegistration {
  account_id: SteamPlayer["account_id"];
  nickname: SteamPlayer["nickname"];
  steam_id: SeasonTeamPlayer["steam_id"];
  organization_id: Organizations["id"];
  team_id: Team["id"];
}
const transformTeamSignupData = (rows: TeamSignupQueryData[]) => {
  if (!rows.length) return null;

  const {
    organization_id,
    team_id,
    external_platform_id,
    captain_steam_id,
    co_captain_steam_id
  } = rows[0];

  const players = rows.map((row) => {
    const steamId = row.steam_id;
    return {
      accountId: 0,
      nickname: "",
      steamId: row.steam_id,
      captain: steamId === captain_steam_id,
      coCaptain: steamId === co_captain_steam_id
    };
  });

  return {
    organizationId: organization_id,
    teamId: team_id,
    teamExternalId: external_platform_id ?? undefined,
    newOrganization: undefined,
    newTeam: undefined,
    players
  } satisfies SignupFormValues;
};

export const getTeamSignupData = async (seasonId: number, teamId: number) => {
  const query = `
    SELECT str.*, stp.steam_id, o.id as organization_id, t.id as team_id FROM SeasonTeamRegistrations str
      INNER JOIN SeasonTeamPlayers stp ON stp.season_id = str.season_id AND stp.team_id = str.team_id
      INNER JOIN Teams t ON t.id = str.team_id
      INNER JOIN Organizations o ON o.id = t.organization_id
    WHERE str.season_id = ? AND str.team_id = ?;
  `;
  const teamSignupData = await runQuery<TeamSignupQueryData[]>(query, [
    seasonId,
    teamId
  ]);
  return transformTeamSignupData(teamSignupData);
};
