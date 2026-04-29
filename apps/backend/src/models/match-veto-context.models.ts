import {
  type Match,
  type MatchVetoContext,
  type MatchVetoContextTeam,
  type MatchVetoContextVeto,
  getDefaultAdminVetoBestOf,
  getVetoTemplate,
  inferVetoBestOfFromOrderedActions
} from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";
import { getSeasonMapPoolForMatch } from "./season-active-map-pool.models";

interface MatchMetaRow {
  match_id: Match["id"];
  stored_best_of: Match["best_of"];
  status: Match["status"];
  stage: Match["stage"];
  external_match_room_id: Match["external_match_room_id"];
  is_round_robin_bo2_as_2xbo1: boolean;
}

export const getMatchVetoSeasonMeta = async (
  matchId: number
): Promise<MatchMetaRow | null> => {
  const rows = await runQuery<MatchMetaRow[]>(
    `SELECT
      m.id AS match_id,
      m.best_of AS stored_best_of,
      m.status,
      m.stage,
      m.external_match_room_id,
      s.is_round_robin_bo2_as_2xbo1
    FROM Matches m
    JOIN Seasons s ON s.id = m.season_id
    WHERE m.id = ?`,
    [matchId]
  );
  return rows[0] ?? null;
};

const getMatchTeams = async (
  matchId: number
): Promise<MatchVetoContextTeam[]> => {
  const query = `
    SELECT mt.team_id, t.name AS team_name
    FROM MatchTeams mt
    JOIN Teams t ON t.id = mt.team_id
    WHERE mt.match_id = ?
    ORDER BY mt.team_id ASC
  `;
  return runQuery<MatchVetoContextTeam[]>(query, [matchId]);
};

const getMatchVetoesWithMapNames = async (
  matchId: number
): Promise<MatchVetoContextVeto[]> => {
  const query = `
    SELECT
      v.id,
      v.team_id,
      t.name AS team_name,
      v.map_id,
      m.name AS map_name,
      v.action,
      v.veto_order
    FROM MatchTeamMapVetoes v
    JOIN Maps m ON m.id = v.map_id
    JOIN Teams t ON t.id = v.team_id
    WHERE v.match_id = ?
    ORDER BY v.veto_order ASC
  `;
  return runQuery<MatchVetoContextVeto[]>(query, [matchId]);
};

export const getMatchVetoContext = async (
  matchId: number
): Promise<MatchVetoContext | null> => {
  const meta = await getMatchVetoSeasonMeta(matchId);
  if (!meta) return null;

  const [teams, mapPool, vetoes] = await Promise.all([
    getMatchTeams(matchId),
    getSeasonMapPoolForMatch(matchId),
    getMatchVetoesWithMapNames(matchId)
  ]);

  const defaultVetoBestOf = getDefaultAdminVetoBestOf({
    storedBestOf: meta.stored_best_of,
    stage: meta.stage,
    isRoundRobinBo2As2xBo1: meta.is_round_robin_bo2_as_2xbo1
  });

  const ordered = [...vetoes].sort((a, b) => a.veto_order - b.veto_order);
  const recordedVetoBestOf =
    ordered.length === 0
      ? null
      : inferVetoBestOfFromOrderedActions(ordered.map((v) => v.action));

  const effectiveBestOf = recordedVetoBestOf ?? defaultVetoBestOf;
  const template = getVetoTemplate(effectiveBestOf) ?? null;

  return {
    match_id: meta.match_id,
    stored_best_of: meta.stored_best_of,
    default_veto_best_of: defaultVetoBestOf,
    recorded_veto_best_of: recordedVetoBestOf,
    external_match_room_id: meta.external_match_room_id,
    best_of: effectiveBestOf,
    status: meta.status,
    teams,
    map_pool: mapPool,
    vetoes,
    template
  } satisfies MatchVetoContext;
};
