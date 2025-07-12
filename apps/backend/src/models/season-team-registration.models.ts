import type { PoolConnection } from "mysql2/promise";
import { runQuery } from "../db/mysqlRunQuery";
import { buildInsertQueryParts } from "../db/utils";
import type {
  InsertSeasonTeamRegistration,
  Organizations,
  SeasonDetails,
  SeasonTeamPlayer,
  SeasonTeamRegistration,
  SeasonTeamRegistrationPlayer,
  SignupFormValues,
  SignupPlayerType,
  SteamPlayer,
  Team,
  UpdateSeasonTeamRegistration
} from "@eggosystem/types";
import _ from "lodash";
import { insertSeasonTeamPlayer } from "./season-team-players.models";
import { getConnection } from "../db/mysqlConnection";
import {
  handleSignupFormForSeason,
  handleSignupFormForSeasonUpdate
} from "../services/season-team-registration.services";

export const getSeasonTeamRegistrationBySeasonAndTeamId = async (
  seasonId: number,
  teamId: number,
  connection?: PoolConnection
) => {
  const result = await runQuery<
    Array<
      SeasonTeamRegistration & {
        captain_steam_id: SteamPlayer["steam_id"];
        co_captain_steam_id: SteamPlayer["steam_id"];
      }
    >
  >(
    `SELECT str.*, 
            MAX(CASE WHEN stp.is_captain = 1 THEN stp.steam_id END) as captain_steam_id,
            MAX(CASE WHEN stp.is_co_captain = 1 THEN stp.steam_id END) as co_captain_steam_id
     FROM SeasonTeamRegistrations str 
       INNER JOIN SeasonTeamRegistrationPlayers stp 
         ON stp.season_id = str.season_id AND stp.team_id = str.team_id 
     WHERE str.season_id = ? AND str.team_id = ? 
     GROUP BY str.season_id, str.team_id`,
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
      data.external_platform_id ?? null,
      seasonId,
      teamId
    ],
    connection
  );
};

export const updatePlayersForSeasonTeamRegistration = async (
  seasonId: number,
  teamId: number,
  playerSteamIds: string[],
  connection?: PoolConnection
) => {
  const existingPlayers = await runQuery<SeasonTeamPlayer[]>(
    `SELECT * FROM SeasonTeamPlayers WHERE season_id = ? AND team_id = ?`,
    [seasonId, teamId],
    connection
  );

  if (existingPlayers.length === 0) {
    throw new Error(
      `No existing registered players for team ID ${teamId} in season ${seasonId}`
    );
  }

  const submittedById = playerSteamIds;
  const existingById = existingPlayers.map((player) => String(player.steam_id));

  const steamIdsToDelete = _.difference(existingById, submittedById);
  const steamIdsToAdd = _.difference(submittedById, existingById);

  if (steamIdsToDelete.length > 0) {
    const placeholders = steamIdsToDelete.map(() => "?").join(", ");
    await runQuery(
      `DELETE FROM SeasonTeamPlayers WHERE season_id = ? AND team_id = ? AND steam_id IN (${placeholders})`,
      [seasonId, teamId, ...steamIdsToDelete],
      connection
    );
  }

  if (steamIdsToAdd.length > 0) {
    await Promise.all(
      steamIdsToAdd.map((steamId) =>
        insertSeasonTeamPlayer(
          seasonId,
          teamId,
          { steam_id: steamId },
          connection
        )
      )
    );
  }
  return { removed: steamIdsToDelete, added: steamIdsToAdd };
};

interface TeamSignupQueryData extends SeasonTeamRegistrationPlayer {
  account_id: SteamPlayer["account_id"];
  nickname: SteamPlayer["nickname"];
  steam_id: SeasonTeamRegistrationPlayer["steam_id"];
  organization_id: Organizations["id"];
  team_id: Team["id"];
  external_platform_id: SeasonTeamRegistration["external_platform_id"];
}
const transformTeamSignupData = (rows: TeamSignupQueryData[]) => {
  if (!rows.length) return null;

  const players = rows.map((row) => {
    return {
      accountId: 0,
      nickname: "",
      steamId: String(row.steam_id),
      captain: row.is_captain,
      coCaptain: row.is_co_captain
    } satisfies SignupPlayerType;
  });

  return {
    organizationId: rows[0].organization_id,
    teamId: rows[0].team_id,
    teamExternalId: rows[0].external_platform_id ?? undefined,
    newOrganization: undefined,
    newTeam: undefined,
    players,
    captainHasReadTermAndConditions: true
  } satisfies SignupFormValues;
};

export const getTeamSignupData = async (seasonId: number, teamId: number) => {
  const query = `
    SELECT str.external_platform_id, stp.*, o.id as organization_id, t.id as team_id 
    FROM SeasonTeamRegistrations str
      INNER JOIN SeasonTeamRegistrationPlayers stp ON stp.season_id = str.season_id AND stp.team_id = str.team_id
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

export const updateSignupForSeason = async (
  season: SeasonDetails,
  teamId: number,
  formData: SignupFormValues
) => {
  const connection = await getConnection();

  try {
    await connection.beginTransaction();
    const data = await handleSignupFormForSeasonUpdate(
      season.id,
      teamId,
      formData,
      connection
    );
    await connection.commit();
    return data;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const addSignupForSeason = async (
  season: SeasonDetails,
  formData: SignupFormValues
) => {
  const connection = await getConnection();

  try {
    await connection.beginTransaction();
    const data = await handleSignupFormForSeason(season, formData, connection);
    await connection.commit();
    return data;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
