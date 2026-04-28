import {
  type Map,
  type Match,
  type MatchVetoContextTeam,
  type MatchVetoContextVeto,
  getVetoTemplate
} from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";
import { getSeasonMapPoolForMatch } from "./season-active-map-pool.models";

interface MatchMetaRow {
  match_id: Match["id"];
  best_of: Match["best_of"];
  status: Match["status"];
}

export const getMatchVetoMeta = async (
  matchId: number
): Promise<MatchMetaRow | null> => {
  const rows = await runQuery<MatchMetaRow[]>(
    "SELECT id AS match_id, best_of, status FROM Matches WHERE id = ?",
    [matchId]
  );
  return rows[0] ?? null;
};

export const getMatchTeams = async (
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

export const getMatchVetoesWithMapNames = async (
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

export const getMatchVetoContext = async (matchId: number) => {
  const meta = await getMatchVetoMeta(matchId);
  if (!meta) return null;

  const [teams, mapPool, vetoes] = await Promise.all([
    getMatchTeams(matchId),
    getSeasonMapPoolForMatch(matchId),
    getMatchVetoesWithMapNames(matchId)
  ]);

  const template = getVetoTemplate(meta.best_of) ?? null;

  return {
    match_id: meta.match_id,
    best_of: meta.best_of,
    status: meta.status,
    teams,
    map_pool: mapPool satisfies Map[],
    vetoes,
    template
  };
};
