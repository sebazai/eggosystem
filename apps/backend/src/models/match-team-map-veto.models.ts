import { type PoolConnection } from "mysql2/promise";
import { runQuery } from "../db/mysqlRunQuery";
import { getHubMatchesByExternalMatchRoomId } from "./match.models";

// FACEIT Match History API Response Interfaces
export interface FaceitMatchHistoryEntity {
  guid: string;
  status: "drop" | "pick";
  random: boolean;
  round: number;
  selected_by: "faction1" | "faction2";
}

export interface FaceitMatchHistoryTicket {
  entities: FaceitMatchHistoryEntity[];
  entity_type: "location" | "map";
  vote_type: "drop_pick";
}

export interface FaceitMatchHistoryPayload {
  match_id: string;
  tickets: FaceitMatchHistoryTicket[];
}

export interface FaceitMatchHistoryResponse {
  payload: FaceitMatchHistoryPayload;
}

const mapFaceitGuidToMapId = async (
  guid: string,
  connection?: PoolConnection
): Promise<number> => {
  const query = `SELECT id FROM Maps WHERE name = ?`;
  const mapMappings = await runQuery<Array<{ id: number }> | undefined>(
    query,
    [guid],
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

export const addMatchTeamMapVeto = async (
  external_match_id: string,
  faction1_hub_team_id: number,
  faction2_hub_team_id: number,
  connection?: PoolConnection
) => {
  const matchHistoryUrl = `https://www.faceit.com/api/democracy/v1/match/${external_match_id}/history`;
  const fetchMatchHistory = await fetch(matchHistoryUrl);
  const internalMatch = await getHubMatchesByExternalMatchRoomId(
    external_match_id,
    connection
  );

  if (!internalMatch || internalMatch.length === 0) {
    throw new Error(
      `No match map vetoes found for external_match_id: ${external_match_id}`
    );
  }

  if (!fetchMatchHistory.ok) {
    throw new Error(
      `Failed to fetch match history for match ${external_match_id}: ${fetchMatchHistory.status} ${fetchMatchHistory.statusText}`
    );
  }

  const matchHistory: FaceitMatchHistoryResponse =
    await fetchMatchHistory.json();

  // Find the map veto ticket
  const mapVetoTicket = matchHistory.payload.tickets.find(
    (ticket) => ticket.entity_type === "map"
  );

  if (!mapVetoTicket) {
    throw new Error(`No map veto data found for match ${external_match_id}`);
  }

  // Process each map veto entity
  for (const match of internalMatch) {
    const vetoPromises = mapVetoTicket.entities.map(async (entity) => {
      const teamId =
        entity.selected_by === "faction1"
          ? faction1_hub_team_id
          : faction2_hub_team_id;
      const action = entity.status;
      const vetoOrder = entity.round;

      const mapId = await mapFaceitGuidToMapId(entity.guid, connection);

      const query = `INSERT INTO MatchTeamMapVetoes (match_id, team_id, map_id, action, veto_order) VALUES (?, ?, ?, ?, ?)`;
      return runQuery<{ insertId: number }>(
        query,
        [match.id, teamId, mapId, action, vetoOrder],
        connection
      );
    });
    await Promise.all(vetoPromises);
  }
};
