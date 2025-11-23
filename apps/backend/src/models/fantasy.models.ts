import { runQuery } from "../db/mysqlRunQuery";

export interface FantasyPlayerStats {
  steam_id: string;
  nickname: string;
  team_id: number;
  team_name: string;
  team_logo: string | null;
  kana_rating: number;
  kd: number;
  kills: number;
  deaths: number;
  adr: number | null;
  adr_t: number | null;
  adr_ct: number | null;
  headshots: number;
  headshot_percentage: number;
  flash_assists: number;
  first_kills: number;
  first_deaths: number;
  kast: number | null;
  maps_played: number;
}

/**
 * Get all players with their stats for a specific league and season
 * for fantasy league drafting
 */
export const getFantasyPlayersByLeague = async (
  seasonId: number,
  leagueId: number
): Promise<FantasyPlayerStats[]> => {
  const query = `
    SELECT 
      p.steam_id,
      p.nickname,
      stp.team_id,
      t.name as team_name,
      t.team_logo,
      ROUND(AVG(ps.kana_rating), 2) as kana_rating,
      ROUND(SUM(ps.kills) / NULLIF(SUM(ps.deaths), 0), 2) as kd,
      SUM(ps.kills) as kills,
      SUM(ps.deaths) as deaths,
      ROUND(AVG(ps.adr), 1) as adr,
      ROUND(AVG(ps.adr_t), 1) as adr_t,
      ROUND(AVG(ps.adr_ct), 1) as adr_ct,
      SUM(ps.headshots) as headshots,
      ROUND((SUM(ps.headshots) / NULLIF(SUM(ps.kills), 0)) * 100, 1) as headshot_percentage,
      SUM(ps.flash_assists) as flash_assists,
      SUM(ps.first_kills) as first_kills,
      SUM(ps.first_deaths) as first_deaths,
      ROUND(AVG(ps.kast), 1) as kast,
      COUNT(DISTINCT ps.match_game_id) as maps_played
    FROM SeasonTeamPlayers stp
    INNER JOIN SteamPlayers p ON p.steam_id = stp.steam_id
    INNER JOIN Teams t ON t.id = stp.team_id
    INNER JOIN SeasonLeagueTeams slt ON slt.team_id = stp.team_id AND slt.season_id = stp.season_id
    LEFT JOIN MatchTeams mt ON mt.team_id = stp.team_id
    LEFT JOIN Matches m ON m.id = mt.match_id AND m.season_id = stp.season_id AND m.league_id = slt.league_id
    LEFT JOIN MatchGames mg ON mg.match_id = m.id
    LEFT JOIN PlayerStats ps ON ps.match_game_id = mg.id AND ps.steam_id = stp.steam_id
    WHERE stp.season_id = ? 
      AND slt.league_id = ?
    GROUP BY p.steam_id, p.nickname, stp.team_id, t.name, t.team_logo
    HAVING maps_played > 0
    ORDER BY t.name ASC, kana_rating DESC
  `;

  return runQuery<FantasyPlayerStats[]>(query, [seasonId, leagueId]);
};
