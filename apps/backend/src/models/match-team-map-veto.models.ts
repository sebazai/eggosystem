import { type PoolConnection } from "mysql2/promise";
import { runQuery } from "../db/mysqlRunQuery";
import {
  getHubMatchesByExternalMatchRoomId,
  updateMatchStatusByExternalMatchroomId
} from "./match.models";
import {
  type ChampionshipDetailsReady,
  type MatchTeamMapVeto,
  resolveVetoAction
} from "@eggosystem/types";
import { getSeasonLeagueTeamByExternalId } from "./season-league-team.models";
import { getConnection } from "../db/mysqlConnection";
import { getSeasonLeagueExternalIdByExternalIdWithSeasonSettings } from "./season-league-external-id.models";
import { NotFoundError } from "../utils/errors";

// FACEIT Match History API Response Interfaces
interface FaceitMatchHistoryEntity {
  guid: string;
  status: "drop" | "pick";
  random: boolean;
  round: number;
  selected_by: "faction1" | "faction2";
}

interface FaceitMatchHistoryTicket {
  entities: FaceitMatchHistoryEntity[];
  entity_type: "location" | "map";
  vote_type: "drop_pick";
}

interface FaceitMatchHistoryPayload {
  match_id: string;
  tickets: FaceitMatchHistoryTicket[];
}

interface FaceitMatchHistoryResponse {
  payload: FaceitMatchHistoryPayload;
}

const getMapIdByGuid = (guid: string) => {
  switch (guid) {
    case "3414036782":
      return "Dogtown";
    case "3070290240":
      return "Brewery";
    default:
      return guid;
  }
};

const mapFaceitGuidToMapId = async (
  guid: string,
  connection?: PoolConnection
): Promise<number> => {
  const getMapName = getMapIdByGuid(guid);
  const query = `SELECT id FROM Maps WHERE name = ?`;
  const mapMappings = await runQuery<Array<{ id: number }> | undefined>(
    query,
    [getMapName],
    connection
  );

  if (!mapMappings || mapMappings.length === 0) {
    throw new Error(`Unknown FACEIT map GUID: ${guid}`);
  }

  const mapId = mapMappings[0].id;
  if (!mapId) {
    throw new Error(`Unknown FACEIT map id for map GUID: ${guid}`);
  }

  return mapId;
};

const addMatchTeamMapVeto = async (
  matchId: number,
  externalMatchId: string,
  best_of: number,
  faction1_hub_team_id: number,
  faction2_hub_team_id: number,
  connection?: PoolConnection
) => {
  const matchHistoryUrl = `https://www.faceit.com/api/democracy/v1/match/${externalMatchId}/history`;
  const fetchMatchHistory = await fetch(matchHistoryUrl);

  if (!fetchMatchHistory.ok) {
    throw new Error(
      `Failed to fetch match history for match ${externalMatchId}: ${fetchMatchHistory.status} ${fetchMatchHistory.statusText}`
    );
  }

  const matchHistory: FaceitMatchHistoryResponse =
    await fetchMatchHistory.json();

  // Find the map veto ticket
  const mapVetoTicket = matchHistory.payload.tickets.find(
    (ticket) => ticket.entity_type === "map"
  );

  if (!mapVetoTicket) {
    throw new Error(`No map veto data found for match ${externalMatchId}`);
  }

  const vetoAmount = mapVetoTicket.entities.length;
  const vetoPromises = mapVetoTicket.entities
    .sort((a, b) => a.round - b.round)
    .map(async (entity) => {
      const teamId =
        entity.selected_by === "faction1"
          ? faction1_hub_team_id
          : faction2_hub_team_id;

      const action = resolveVetoAction(
        best_of,
        entity.round,
        vetoAmount,
        entity.status
      );

      const vetoOrder = entity.round;

      const mapId = await mapFaceitGuidToMapId(entity.guid, connection);

      const query = `INSERT INTO MatchTeamMapVetoes (match_id, team_id, map_id, action, veto_order) VALUES (?, ?, ?, ?, ?)
                      ON DUPLICATE KEY UPDATE action = VALUES(action)`;
      return runQuery<{ insertId: number }>(
        query,
        [matchId, teamId, mapId, action, vetoOrder],
        connection
      );
    });
  await Promise.all(vetoPromises);
};

export const addMatchTeamMapVetoes = async (
  details: ChampionshipDetailsReady,
  externalLeagueId: string
) => {
  const connection = await getConnection();
  try {
    await connection.beginTransaction();

    const { match_id, best_of } = details;
    const matches = await getHubMatchesByExternalMatchRoomId(
      match_id,
      connection
    );

    const seasonExternal =
      await getSeasonLeagueExternalIdByExternalIdWithSeasonSettings(
        externalLeagueId,
        connection
      );

    if (!seasonExternal) {
      throw new NotFoundError(
        `Could not find season external league row for id ${externalLeagueId}`
      );
    }

    if (!matches || matches.length === 0) {
      throw new Error(
        `No matches found when adding match games for external_id: ${externalLeagueId}`
      );
    }

    const teamOneExternalId = details.teams.faction1.faction_id;
    const teamTwoExternalId = details.teams.faction2.faction_id;

    const teamOne = await getSeasonLeagueTeamByExternalId(
      teamOneExternalId,
      seasonExternal.season_id,
      connection
    );
    const teamTwo = await getSeasonLeagueTeamByExternalId(
      teamTwoExternalId,
      seasonExternal.season_id,
      connection
    );

    if (!teamOne || !teamTwo) {
      throw new Error(
        `No SeasonLeagueTeam entry in addMatchGamesForMatch found for external_id: ${teamOneExternalId} or ${teamTwoExternalId}`
      );
    }

    await Promise.all(
      matches.map((match) =>
        addMatchTeamMapVeto(
          match.id,
          match_id,
          best_of,
          teamOne.team_id,
          teamTwo.team_id,
          connection
        )
      )
    );
    if (!matches.some((m) => m.status === "FINISHED")) {
      await updateMatchStatusByExternalMatchroomId(
        match_id,
        "ONGOING",
        connection
      );
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const deleteMatchTeamMapVetoesByMatchId = async (
  matchId: number,
  connection?: PoolConnection
): Promise<number> => {
  const result = await runQuery<{ affectedRows: number }>(
    `DELETE FROM MatchTeamMapVetoes WHERE match_id = ?`,
    [matchId],
    connection
  );
  return result.affectedRows;
};

export const getMatchPickedMapsOrderedByVetoOrder = async (
  matchId: number,
  connection?: PoolConnection
) => {
  return runQuery<Array<MatchTeamMapVeto>>(
    `SELECT * FROM MatchTeamMapVetoes WHERE match_id = ? AND (action = "pick" OR action = "decider") ORDER BY veto_order ASC;`,
    [matchId],
    connection
  );
};
