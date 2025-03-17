import { runQuery } from "../db/mysqlRunQuery";

interface TopTeamStats {
  team_id: number;
  team_name: string;
  team_logo: string;
  league_name: string;
  matches_played: number;
  kana: number;
  rank: number;
}

export const getTopTeams = async (
  leagueId: number,
  seasonId: number,
  stage?: number,
  mapId?: number
): Promise<TopTeamStats[]> => {
  const baseQuery = `
    WITH TeamAverages AS (
      SELECT 
        t.id as team_id,
        t.name as team_name,
        CONCAT('/teams/', COALESCE(t.team_logo, 'nologo.svg')) as team_logo,
        l.name as league_name,
        COUNT(DISTINCT mmp.id) as matches_played,
        AVG(ps.kana_rating) as avg_kana_rating,
        ROW_NUMBER() OVER (PARTITION BY l.id ORDER BY AVG(ps.kana_rating) DESC) as rank
      FROM Teams t
      JOIN MatchTeams mt ON mt.team_id = t.id
      JOIN Matches m ON m.id = mt.match_id
      JOIN Leagues l ON l.id = m.league_id
      JOIN MatchMapsPlayed mmp ON mmp.match_id = m.id
      JOIN PlayerStats ps ON ps.match_maps_played_id = mmp.id
      JOIN SeasonTeamPlayers stp ON stp.steam_id = ps.steam_id 
        AND stp.team_id = t.id 
        AND stp.season_id = m.season_id
      WHERE m.league_id = ?
      AND m.season_id = ?
      ${stage !== undefined ? "AND m.stage = ?" : ""}
      ${mapId !== undefined ? "AND mmp.map_id = ?" : ""}
      GROUP BY t.id, t.name, t.team_logo, l.id, l.name
    )
    SELECT 
      team_id,
      team_name,
      team_logo,
      league_name,
      matches_played,
      CAST(ROUND(avg_kana_rating, 3) AS DECIMAL(10,3)) as kana,
      rank
    FROM TeamAverages
    WHERE rank <= 5
    ORDER BY avg_kana_rating DESC
  `;

  const params = [
    leagueId,
    seasonId,
    ...(stage !== undefined ? [stage] : []),
    ...(mapId !== undefined ? [mapId] : [])
  ];

  return runQuery<TopTeamStats[]>(baseQuery, params);
};
