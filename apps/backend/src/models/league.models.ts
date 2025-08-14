import { runQuery } from "../db/mysqlRunQuery";
import type { League, LeaguesBySeason } from "@eggosystem/types";

export const getLeagues = async (): Promise<League[]> => {
  return runQuery<League[]>("SELECT * FROM Leagues");
};

export const getLeaguesBySeason = async (
  seasonId: number
): Promise<LeaguesBySeason[]> => {
  const leaguesQuery = `
    SELECT 
      l.id,
      l.name,
      sl.season_id,
      sl.tier
    FROM Leagues l
    JOIN SeasonLeagues sl ON l.id = sl.league_id
    WHERE sl.season_id = ?
    ORDER BY sl.tier ASC
  `;

  return runQuery<LeaguesBySeason[]>(leaguesQuery, [seasonId]);
};
