import type {
  RosterHistoryPlayer,
  RosterHistorySeason
} from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";

interface RosterHistoryRow {
  season_id: number;
  season_name: string;
  steam_id: string;
  nickname: string | null;
  is_captain: number;
  is_co_captain: number;
}

/**
 * Get roster history for a team across all seasons
 * Returns players registered for this team in each season
 */
export const getTeamRosterHistory = async (
  teamId: number
): Promise<RosterHistorySeason[]> => {
  const query = `
    SELECT 
      s.id as season_id,
      s.name as season_name,
      strp.steam_id,
      sp.nickname,
      strp.is_captain,
      strp.is_co_captain
    FROM SeasonTeamRegistrationPlayers strp
      INNER JOIN Seasons s ON s.id = strp.season_id
      LEFT JOIN SteamPlayers sp ON sp.steam_id = strp.steam_id
    WHERE strp.team_id = ?
    ORDER BY s.id DESC, strp.is_captain DESC, strp.is_co_captain DESC
  `;

  const rows = await runQuery<RosterHistoryRow[]>(query, [teamId]);

  // Group by season
  const seasonMap = new Map<number, RosterHistorySeason>();

  for (const row of rows) {
    if (!seasonMap.has(row.season_id)) {
      seasonMap.set(row.season_id, {
        seasonId: row.season_id,
        seasonName: row.season_name,
        players: []
      });
    }

    const season = seasonMap.get(row.season_id)!;
    season.players.push({
      steamId: String(row.steam_id),
      nickname: row.nickname ?? "",
      isCaptain: row.is_captain === 1,
      isCoCaptain: row.is_co_captain === 1
    } satisfies RosterHistoryPlayer);
  }

  return Array.from(seasonMap.values());
};
